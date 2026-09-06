/**
 * Maintenance Dimension Scorer
 *
 * Pure function — no I/O, no side effects, no imports from outside this package.
 * Measures: issue response time, PR response time, merge rate, release recency, backlog trend.
 */
import type { NormalizedMaintenance, DimensionScoreResult, ScoreBreakdownItem } from '../types.js';
import { MAINTENANCE } from '../config.js';

/**
 * Interpolate a score linearly between [minVal, maxVal] → [minScore, maxScore].
 * Values outside the range are clamped.
 */
function interpolate(
  value: number,
  minVal: number,
  maxVal: number,
  maxScore: number,
  minScore: number = 0,
  invert: boolean = false,
): number {
  const clamped = Math.max(minVal, Math.min(maxVal, value));
  const ratio = (clamped - minVal) / (maxVal - minVal);
  const score = invert
    ? minScore + (1 - ratio) * (maxScore - minScore)
    : minScore + ratio * (maxScore - minScore);
  return Math.round(score * 10) / 10;
}

export function scoreMaintenance(data: NormalizedMaintenance): DimensionScoreResult {
  const breakdown: ScoreBreakdownItem[] = [];
  let total = 0;

  // ── Issue first response ──────────────────────────────────────────────────
  const issueResponsePoints = (() => {
    const h = data.avgIssueFirstResponseHours;
    if (h <= MAINTENANCE.ISSUE_RESPONSE_EXCELLENT_HOURS) {
      return MAINTENANCE.ISSUE_RESPONSE_MAX_POINTS;
    } else if (h <= MAINTENANCE.ISSUE_RESPONSE_GOOD_HOURS) {
      return interpolate(
        h,
        MAINTENANCE.ISSUE_RESPONSE_EXCELLENT_HOURS,
        MAINTENANCE.ISSUE_RESPONSE_GOOD_HOURS,
        MAINTENANCE.ISSUE_RESPONSE_MAX_POINTS,
        Math.round(MAINTENANCE.ISSUE_RESPONSE_MAX_POINTS * 0.6),
        true,
      );
    } else if (h <= MAINTENANCE.ISSUE_RESPONSE_POOR_HOURS) {
      return interpolate(
        h,
        MAINTENANCE.ISSUE_RESPONSE_GOOD_HOURS,
        MAINTENANCE.ISSUE_RESPONSE_POOR_HOURS,
        Math.round(MAINTENANCE.ISSUE_RESPONSE_MAX_POINTS * 0.6),
        Math.round(MAINTENANCE.ISSUE_RESPONSE_MAX_POINTS * 0.2),
        true,
      );
    }
    return Math.round(MAINTENANCE.ISSUE_RESPONSE_MAX_POINTS * 0.1);
  })();
  breakdown.push({ label: 'Issue first-response speed', delta: issueResponsePoints });
  total += issueResponsePoints;

  // ── PR first review ───────────────────────────────────────────────────────
  const prReviewPoints = (() => {
    const h = data.avgPrFirstReviewHours;
    if (h <= MAINTENANCE.PR_REVIEW_EXCELLENT_HOURS) {
      return MAINTENANCE.PR_REVIEW_MAX_POINTS;
    } else if (h <= MAINTENANCE.PR_REVIEW_GOOD_HOURS) {
      return interpolate(
        h,
        MAINTENANCE.PR_REVIEW_EXCELLENT_HOURS,
        MAINTENANCE.PR_REVIEW_GOOD_HOURS,
        MAINTENANCE.PR_REVIEW_MAX_POINTS,
        Math.round(MAINTENANCE.PR_REVIEW_MAX_POINTS * 0.6),
        true,
      );
    } else if (h <= MAINTENANCE.PR_REVIEW_POOR_HOURS) {
      return interpolate(
        h,
        MAINTENANCE.PR_REVIEW_GOOD_HOURS,
        MAINTENANCE.PR_REVIEW_POOR_HOURS,
        Math.round(MAINTENANCE.PR_REVIEW_MAX_POINTS * 0.6),
        Math.round(MAINTENANCE.PR_REVIEW_MAX_POINTS * 0.2),
        true,
      );
    }
    return Math.round(MAINTENANCE.PR_REVIEW_MAX_POINTS * 0.1);
  })();
  breakdown.push({ label: 'PR first-review speed', delta: prReviewPoints });
  total += prReviewPoints;

  // ── PR merge rate ─────────────────────────────────────────────────────────
  const prMergePoints = Math.round(data.prMergeRate * MAINTENANCE.PR_MERGE_RATE_MAX_POINTS);
  breakdown.push({ label: 'PR merge rate', delta: prMergePoints });
  total += prMergePoints;

  // ── Issue resolution rate ─────────────────────────────────────────────────
  const issueResPoints = Math.round(data.issueResolutionRate * MAINTENANCE.ISSUE_RESOLUTION_RATE_MAX_POINTS);
  breakdown.push({ label: 'Issue resolution rate', delta: issueResPoints });
  total += issueResPoints;

  // ── Release recency ───────────────────────────────────────────────────────
  const releaseRecencyPoints = (() => {
    const d = data.daysSinceLastRelease;
    if (d <= MAINTENANCE.RELEASE_RECENCY_EXCELLENT_DAYS) return MAINTENANCE.RELEASE_RECENCY_MAX_POINTS;
    if (d <= MAINTENANCE.RELEASE_RECENCY_GOOD_DAYS) {
      return interpolate(
        d,
        MAINTENANCE.RELEASE_RECENCY_EXCELLENT_DAYS,
        MAINTENANCE.RELEASE_RECENCY_GOOD_DAYS,
        MAINTENANCE.RELEASE_RECENCY_MAX_POINTS,
        Math.round(MAINTENANCE.RELEASE_RECENCY_MAX_POINTS * 0.5),
        true,
      );
    }
    if (d <= MAINTENANCE.RELEASE_RECENCY_POOR_DAYS) {
      return interpolate(
        d,
        MAINTENANCE.RELEASE_RECENCY_GOOD_DAYS,
        MAINTENANCE.RELEASE_RECENCY_POOR_DAYS,
        Math.round(MAINTENANCE.RELEASE_RECENCY_MAX_POINTS * 0.5),
        0,
        true,
      );
    }
    return 0;
  })();
  breakdown.push({ label: 'Release recency', delta: releaseRecencyPoints });
  total += releaseRecencyPoints;

  // ── Backlog trend penalty ─────────────────────────────────────────────────
  const backlogPenalty = (() => {
    const trend = Math.max(0, data.prBacklogTrendPct + data.issueBacklogTrendPct) / 2;
    if (trend <= 0) return 0;
    const raw = Math.floor(trend / 10) * MAINTENANCE.BACKLOG_TREND_PENALTY_PER_10PCT;
    return Math.min(raw, MAINTENANCE.BACKLOG_TREND_MAX_PENALTY);
  })();
  if (backlogPenalty > 0) {
    breakdown.push({ label: 'Backlog growth trend', delta: -backlogPenalty });
    total -= backlogPenalty;
  }

  const score = Math.max(0, Math.min(100, Math.round(total)));
  return { score, breakdown };
}
