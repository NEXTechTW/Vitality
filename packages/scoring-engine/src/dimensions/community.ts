/**
 * Community Dimension Scorer
 *
 * Pure function — no I/O, no side effects.
 * Measures: active contributors, diversity index, growth, new contributors.
 */
import type { NormalizedCommunity, DimensionScoreResult, ScoreBreakdownItem } from '../types.js';
import { COMMUNITY } from '../config.js';

export function scoreCommunity(data: NormalizedCommunity): DimensionScoreResult {
  const breakdown: ScoreBreakdownItem[] = [];
  let total = 0;

  // ── Active contributor count ──────────────────────────────────────────────
  const contributorPoints = (() => {
    const c = data.activeContributors;
    if (c >= COMMUNITY.CONTRIBUTORS_EXCELLENT) return COMMUNITY.CONTRIBUTORS_MAX_POINTS;
    if (c >= COMMUNITY.CONTRIBUTORS_GOOD) {
      const ratio = (c - COMMUNITY.CONTRIBUTORS_GOOD) / (COMMUNITY.CONTRIBUTORS_EXCELLENT - COMMUNITY.CONTRIBUTORS_GOOD);
      return Math.round(COMMUNITY.CONTRIBUTORS_MAX_POINTS * (0.6 + 0.4 * ratio));
    }
    if (c >= COMMUNITY.CONTRIBUTORS_POOR) {
      const ratio = (c - COMMUNITY.CONTRIBUTORS_POOR) / (COMMUNITY.CONTRIBUTORS_GOOD - COMMUNITY.CONTRIBUTORS_POOR);
      return Math.round(COMMUNITY.CONTRIBUTORS_MAX_POINTS * 0.3 * ratio);
    }
    if (c === 1) return Math.round(COMMUNITY.CONTRIBUTORS_MAX_POINTS * 0.1);
    return 0;
  })();
  breakdown.push({ label: 'Active contributors in window', delta: contributorPoints });
  total += contributorPoints;

  // ── Diversity index ───────────────────────────────────────────────────────
  // index is 0–1; scale to max points
  const diversityPoints = Math.round(data.contributorDiversityIndex * COMMUNITY.DIVERSITY_MAX_POINTS);
  breakdown.push({ label: 'Contributor diversity index', delta: diversityPoints });
  total += diversityPoints;

  // ── Contributor growth ────────────────────────────────────────────────────
  const growthPoints = (() => {
    const g = data.contributorGrowthPct;
    if (g >= COMMUNITY.GROWTH_EXCELLENT_PCT) return COMMUNITY.GROWTH_MAX_POINTS;
    if (g >= COMMUNITY.GROWTH_GOOD_PCT) {
      const ratio = (g - COMMUNITY.GROWTH_GOOD_PCT) / (COMMUNITY.GROWTH_EXCELLENT_PCT - COMMUNITY.GROWTH_GOOD_PCT);
      return Math.round(COMMUNITY.GROWTH_MAX_POINTS * (0.5 + 0.5 * ratio));
    }
    if (g >= 0) {
      return Math.round(COMMUNITY.GROWTH_MAX_POINTS * 0.3);
    }
    // Negative growth — penalty
    const penalty = Math.min(COMMUNITY.GROWTH_NEGATIVE_PENALTY, Math.abs(g) / 5);
    return -Math.round(penalty);
  })();
  breakdown.push({ label: 'Contributor count growth', delta: growthPoints });
  total += growthPoints;

  // ── New contributors ──────────────────────────────────────────────────────
  const newContribPoints = (() => {
    const n = data.newContributors;
    if (n >= COMMUNITY.NEW_CONTRIBUTORS_EXCELLENT) return COMMUNITY.NEW_CONTRIBUTORS_MAX_POINTS;
    return Math.round((n / COMMUNITY.NEW_CONTRIBUTORS_EXCELLENT) * COMMUNITY.NEW_CONTRIBUTORS_MAX_POINTS);
  })();
  breakdown.push({ label: 'New contributors this window', delta: newContribPoints });
  total += newContribPoints;

  const score = Math.max(0, Math.min(100, Math.round(total)));
  return { score, breakdown };
}
