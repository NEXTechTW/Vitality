/**
 * /v1/projects routes
 *
 * GET  /v1/projects/:owner/:repo          — latest health report
 * POST /v1/projects/:owner/:repo/analyze  — trigger fresh analysis (async)
 * GET  /v1/projects/:owner/:repo/history  — historical score time series
 */
import type { FastifyPluginAsync } from 'fastify';
import type postgres from 'postgres';
import type { Redis } from 'ioredis';
import { collect } from '@vitality/collectors';
import { computeScore } from '@vitality/scoring-engine';
import { assembleReport } from '@vitality/cli';

// Per-repo cooldown: minimum 5 minutes between triggered analyses
const ANALYZE_COOLDOWN_SECONDS = 300;

declare module 'fastify' {
  interface FastifyInstance {
    sql: postgres.Sql;
    redis: Redis;
  }
}

export const projectRoutes: FastifyPluginAsync = async (app) => {
  // GET /v1/projects/:owner/:repo — latest report
  app.get<{ Params: { owner: string; repo: string } }>(
    '/:owner/:repo',
    async (req, reply) => {
      const { owner, repo } = req.params;

      // Check Redis cache first (30-minute TTL)
      const cacheKey = `report:${owner}:${repo}`;
      const cached = await app.redis.get(cacheKey);
      if (cached) {
        return reply.header('X-Cache', 'HIT').send(JSON.parse(cached) as object);
      }

      const rows = await app.sql<{ report: object; created_at: string }[]>`
        SELECT report, created_at FROM snapshots
        WHERE owner = ${owner} AND repo = ${repo}
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (rows.length === 0) {
        return reply.code(404).send({ error: 'No analysis found. POST /analyze to trigger one.' });
      }

      const result = { ...rows[0]?.report as object, fetched_at: rows[0]?.created_at };
      await app.redis.setex(cacheKey, 1800, JSON.stringify(result));
      return reply.header('X-Cache', 'MISS').send(result);
    },
  );

  // POST /v1/projects/:owner/:repo/analyze — queue an analysis job
  app.post<{ Params: { owner: string; repo: string } }>(
    '/:owner/:repo/analyze',
    async (req, reply) => {
      const { owner, repo } = req.params;

      // Cooldown check
      const cooldownKey = `cooldown:${owner}:${repo}`;
      const onCooldown = await app.redis.exists(cooldownKey);
      if (onCooldown) {
        const ttl = await app.redis.ttl(cooldownKey);
        return reply.code(429).send({
          error: 'Analysis on cooldown.',
          retry_after_seconds: ttl,
        });
      }

      // Enqueue job
      const [job] = await app.sql<{ id: string }[]>`
        INSERT INTO analysis_jobs (owner, repo, status)
        VALUES (${owner}, ${repo}, 'pending')
        RETURNING id
      `;

      await app.redis.setex(cooldownKey, ANALYZE_COOLDOWN_SECONDS, '1');

      // Run analysis inline for MVP (would be a background worker in production)
      setImmediate(() => void runAnalysis(app, owner, repo, job?.id ?? '0'));

      return reply.code(202).send({
        job_id: job?.id,
        message: 'Analysis queued. Poll GET /:owner/:repo for the result.',
      });
    },
  );

  // GET /v1/projects/:owner/:repo/history — score history time series
  app.get<{ Params: { owner: string; repo: string }; Querystring: { limit?: string } }>(
    '/:owner/:repo/history',
    async (req, reply) => {
      const { owner, repo } = req.params;
      const limit = Math.min(parseInt(req.query.limit ?? '90', 10), 365);

      const rows = await app.sql<{ score: number; created_at: string }[]>`
        SELECT score, created_at FROM snapshots
        WHERE owner = ${owner} AND repo = ${repo}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;

      return { project: `${owner}/${repo}`, history: rows.reverse() };
    },
  );
};

async function runAnalysis(
  app: { sql: postgres.Sql; redis: Redis },
  owner: string,
  repo: string,
  jobId: string,
): Promise<void> {
  try {
    await app.sql`
      UPDATE analysis_jobs SET status = 'running', started_at = NOW() WHERE id = ${jobId}
    `;

    const token = process.env['GITHUB_TOKEN'] ?? '';
    const normalized = await collect({ owner, repo, token });
    const result = computeScore(normalized);
    const report = assembleReport(result, {
      avgDaysBetweenReleases: normalized.releases.avgDaysBetweenReleases,
      releaseIntervalStdDev: normalized.releases.releaseIntervalStdDev,
      knownVulnerabilities: normalized.security.knownVulnerabilities,
      activeContributors: normalized.community.activeContributors,
      contributorGrowthPct: normalized.community.contributorGrowthPct,
      contributorDiversityIndex: normalized.community.contributorDiversityIndex,
      issueResponse: normalized.maintenance.avgIssueFirstResponseHours,
      prResponse: normalized.maintenance.avgPrFirstReviewHours,
      majorVersionBumps: normalized.releases.majorVersionBumps,
      totalReleases: normalized.releases.totalReleases,
    });

    const [snapshot] = await app.sql<{ id: string }[]>`
      INSERT INTO snapshots (owner, repo, score, report)
      VALUES (${owner}, ${repo}, ${result.score}, ${JSON.stringify(report)})
      RETURNING id
    `;

    await app.sql`
      INSERT INTO latest_snapshots (owner, repo, snapshot_id, score, updated_at)
      VALUES (${owner}, ${repo}, ${snapshot?.id ?? 0}, ${result.score}, NOW())
      ON CONFLICT (owner, repo) DO UPDATE
        SET snapshot_id = EXCLUDED.snapshot_id,
            score = EXCLUDED.score,
            updated_at = EXCLUDED.updated_at
    `;

    await app.sql`
      UPDATE analysis_jobs SET status = 'done', finished_at = NOW() WHERE id = ${jobId}
    `;

    // Bust cache
    await app.redis.del(`report:${owner}:${repo}`);
  } catch (err) {
    await app.sql`
      UPDATE analysis_jobs
      SET status = 'failed', error = ${String(err)}, finished_at = NOW()
      WHERE id = ${jobId}
    `;
  }
}
