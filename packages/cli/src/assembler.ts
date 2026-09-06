/**
 * Report assembler — combines ScoringEngineOutput into the vitality.json format
 * and validates it against the JSON Schema before writing.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AjvModule from 'ajv';
import type { ScoringEngineOutput } from '@vitality/scoring-engine';

import { existsSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadSchema(): object {
  const candidates = [
    path.resolve(__dirname, '../../../schemas/vitality.schema.json'),
    path.resolve(__dirname, '../../schemas/vitality.schema.json'),
    path.resolve(process.cwd(), 'schemas/vitality.schema.json'),
    path.resolve(process.cwd(), '../../schemas/vitality.schema.json'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return JSON.parse(readFileSync(candidate, 'utf-8')) as object;
    }
  }
  return { type: 'object', required: ['protocol_version', 'project', 'score'] };
}

const schema = loadSchema();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Ajv = ((AjvModule as any).default ?? AjvModule) as any;
const ajv = new Ajv({ strict: false, logger: false });
const validate = ajv.compile(schema);

export interface VitalityReport {
  protocol_version: string;
  project: string;
  generated_at: string;
  score: number;
  maintenance: {
    score: number;
    release_frequency?: number | undefined;
    issue_response?: number | undefined;
    pull_request_response?: number | undefined;
    backlog_trend?: string | undefined;
    breakdown: { label: string; delta: number }[];
  };
  community: {
    score: number;
    active_contributors?: number | undefined;
    contributor_growth?: number | undefined;
    contributor_diversity_index?: number | undefined;
    breakdown: { label: string; delta: number }[];
  };
  security: {
    score: number;
    known_vulnerabilities?: number | undefined;
    dependency_risk?: string | undefined;
    last_security_release_days_ago?: number | undefined;
    breakdown: { label: string; delta: number }[];
  };
  releases: {
    score: number;
    frequency?: string | undefined;
    stability?: string | undefined;
    breaking_change_rate?: string | undefined;
    breakdown: { label: string; delta: number }[];
  };
  provenance: {
    data_sources: string[];
    computation_hash: string;
    reproducible: boolean;
    algorithm_version: string;
  };
}

function releaseFrequency(avgDays: number): string {
  if (avgDays <= 30) return 'frequent';
  if (avgDays <= 90) return 'healthy';
  if (avgDays <= 180) return 'infrequent';
  return 'stale';
}

function releaseStability(stdDev: number): string {
  if (stdDev <= 7) return 'high';
  if (stdDev <= 21) return 'medium';
  return 'low';
}

function depRisk(vuln: number): string {
  if (vuln === 0) return 'none';
  if (vuln <= 2) return 'low';
  if (vuln <= 5) return 'medium';
  return 'high';
}

export interface ExtraMetrics {
  avgDaysBetweenReleases?: number | undefined;
  releaseIntervalStdDev?: number | undefined;
  knownVulnerabilities?: number | undefined;
  daysSinceSecurityRelease?: number | undefined;
  activeContributors?: number | undefined;
  contributorGrowthPct?: number | undefined;
  contributorDiversityIndex?: number | undefined;
  issueResponse?: number | undefined;
  prResponse?: number | undefined;
  releaseFrequency?: number | undefined;
  backlogTrendPct?: number | undefined;
  majorVersionBumps?: number | undefined;
  totalReleases?: number | undefined;
}

export function assembleReport(
  result: ScoringEngineOutput,
  extra?: ExtraMetrics,
): VitalityReport {
  const report: VitalityReport = {
    protocol_version: '1.0',
    project: result.project,
    generated_at: new Date().toISOString(),
    score: result.score,
    maintenance: {
      score: result.maintenance.score,
      issue_response: extra?.issueResponse,
      pull_request_response: extra?.prResponse,
      release_frequency: extra?.releaseFrequency,
      backlog_trend: extra?.backlogTrendPct !== undefined
        ? `${extra.backlogTrendPct >= 0 ? '+' : ''}${extra.backlogTrendPct.toFixed(0)}% (${90}d)`
        : undefined,
      breakdown: result.maintenance.breakdown,
    },
    community: {
      score: result.community.score,
      active_contributors: extra?.activeContributors,
      contributor_growth: extra?.contributorGrowthPct,
      contributor_diversity_index: extra?.contributorDiversityIndex,
      breakdown: result.community.breakdown,
    },
    security: {
      score: result.security.score,
      known_vulnerabilities: extra?.knownVulnerabilities,
      dependency_risk: depRisk(extra?.knownVulnerabilities ?? 0),
      last_security_release_days_ago: extra?.daysSinceSecurityRelease,
      breakdown: result.security.breakdown,
    },
    releases: {
      score: result.releases.score,
      frequency: releaseFrequency(extra?.avgDaysBetweenReleases ?? 999),
      stability: releaseStability(extra?.releaseIntervalStdDev ?? 999),
      breaking_change_rate: (() => {
        const rate = extra?.totalReleases
          ? (extra.majorVersionBumps ?? 0) / extra.totalReleases
          : 0;
        if (rate <= 0.05) return 'none';
        if (rate <= 0.20) return 'low';
        if (rate <= 0.40) return 'medium';
        return 'high';
      })(),
      breakdown: result.releases.breakdown,
    },
    provenance: {
      data_sources: ['github_api', 'osv_database'],
      computation_hash: result.computationHash,
      reproducible: true,
      algorithm_version: result.algorithmVersion,
    },
  };

  // Schema validation — invalid output is a hard error, not a warning
  const valid = validate(report);
  if (!valid) {
    throw new Error(
      `vitality.json failed schema validation:\n${JSON.stringify(validate.errors, null, 2)}`,
    );
  }

  return report;
}
