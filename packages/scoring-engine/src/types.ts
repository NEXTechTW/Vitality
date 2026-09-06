/**
 * Vitality Scoring Engine — Core Types
 *
 * These types define the ONLY inputs/outputs of the deterministic scoring engine.
 * No network types, no GitHub API shapes, no LLM response types may appear here.
 */

// ─────────────────────────────────────────────────────────────────────────────
// INPUT: Normalized repository data (produced by the collectors/normalizer)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The normalized, clean, windowed representation of a repository's activity.
 * This is the ONLY input the scoring engine accepts.
 * All raw GitHub/OSV specifics are absorbed by the normalizer before reaching here.
 */
export interface NormalizedRepoData {
  /** GitHub owner/repo slug */
  project: string;

  /** The rolling analysis window in days (default: 90) */
  windowDays: number;

  maintenance: NormalizedMaintenance;
  community: NormalizedCommunity;
  security: NormalizedSecurity;
  releases: NormalizedReleases;
}

export interface NormalizedMaintenance {
  /** Average hours between an issue being opened and receiving first response (last windowDays) */
  avgIssueFirstResponseHours: number;
  /** Ratio of issues closed vs opened in the window (0–1) */
  issueResolutionRate: number;
  /** Average hours between a PR being opened and receiving first review */
  avgPrFirstReviewHours: number;
  /** Ratio of PRs merged vs opened in the window (0–1) */
  prMergeRate: number;
  /** Days since last release */
  daysSinceLastRelease: number;
  /** Number of releases in the window */
  releasesInWindow: number;
  /** Open PR backlog percentage change over the window (+N% means growing) */
  prBacklogTrendPct: number;
  /** Open issue backlog percentage change over the window */
  issueBacklogTrendPct: number;
}

export interface NormalizedCommunity {
  /** Number of unique commit authors active in the window */
  activeContributors: number;
  /** Percentage growth in contributor count vs previous window */
  contributorGrowthPct: number;
  /**
   * Gini-coefficient-like diversity index (0–1).
   * 1.0 = perfectly uniform distribution across contributors.
   * 0.0 = single contributor does everything.
   */
  contributorDiversityIndex: number;
  /** Number of first-time contributors in the window */
  newContributors: number;
  /** Total commits in the window (excluding bot-authored) */
  totalHumanCommits: number;
}

export interface NormalizedSecurity {
  /** Number of known unpatched CVEs in direct dependencies */
  knownVulnerabilities: number;
  /** Highest CVSS score among known vulnerabilities (0–10, 0 if none) */
  maxCvssScore: number;
  /** Days since the last security-related release (Infinity if never) */
  daysSinceSecurityRelease: number;
  /** Total number of direct dependencies */
  totalDependencies: number;
  /** Number of dependencies that are outdated (behind latest major) */
  outdatedDependencies: number;
}

export interface NormalizedReleases {
  /** Average days between releases over the window */
  avgDaysBetweenReleases: number;
  /** Standard deviation of release intervals (high = unstable cadence) */
  releaseIntervalStdDev: number;
  /** Number of major version bumps in the window */
  majorVersionBumps: number;
  /** Total releases in the window */
  totalReleases: number;
  /** Days since the very first release of this project */
  projectAgeDays: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// OUTPUT: Score results
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single labeled factor that contributed points to a dimension score.
 * Explainability is a first-class part of every score result.
 */
export interface ScoreBreakdownItem {
  label: string;
  delta: number; // positive = points added, negative = points subtracted
}

/**
 * The result of scoring a single dimension.
 */
export interface DimensionScoreResult {
  /** Numeric score 0–100 */
  score: number;
  /** Full breakdown of what added/subtracted points */
  breakdown: ScoreBreakdownItem[];
}

/**
 * The full output of the scoring engine — everything needed to assemble vitality.json.
 */
export interface ScoringEngineOutput {
  project: string;
  /** Weighted overall score 0–100 */
  score: number;
  maintenance: DimensionScoreResult;
  community: DimensionScoreResult;
  security: DimensionScoreResult;
  releases: DimensionScoreResult;
  /** SHA-256 hash over (normalized input JSON + algorithm version) */
  computationHash: string;
  algorithmVersion: string;
}
