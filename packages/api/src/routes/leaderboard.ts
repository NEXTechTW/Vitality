/**
 * GET /v1/leaderboard — top healthy projects ranked by score
 */
import type { FastifyPluginAsync } from 'fastify';

export const leaderboardRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: { limit?: string; page?: string } }>(
    '/',
    async (req, reply) => {
      const limit = Math.min(parseInt(req.query.limit ?? '25', 10), 100);
      const page = Math.max(parseInt(req.query.page ?? '1', 10), 1);
      const offset = (page - 1) * limit;

      const rows = await app.sql<{ owner: string; repo: string; score: number; updated_at: string }[]>`
        SELECT owner, repo, score, updated_at
        FROM latest_snapshots
        ORDER BY score DESC, updated_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      return {
        page,
        limit,
        results: rows.map((r, i) => ({
          rank: offset + i + 1,
          project: `${r.owner}/${r.repo}`,
          score: r.score,
          last_analyzed: r.updated_at,
        })),
      };
    },
  );
};
