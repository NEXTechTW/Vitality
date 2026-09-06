/**
 * Security Dimension Scorer
 *
 * Pure function — no I/O, no side effects, no CVE lookups.
 * The collector/normalizer resolves CVEs before this function is called.
 * This function only processes pre-normalized security data.
 */
import type { NormalizedSecurity, DimensionScoreResult, ScoreBreakdownItem } from '../types.js';
import { SECURITY } from '../config.js';

export function scoreSecurity(data: NormalizedSecurity): DimensionScoreResult {
  const breakdown: ScoreBreakdownItem[] = [];
  let score = SECURITY.NO_VULN_BASE_SCORE;

  // ── Known vulnerability penalties ─────────────────────────────────────────
  if (data.knownVulnerabilities > 0) {
    const cvss = data.maxCvssScore;
    let penalty: number;

    if (cvss >= 9.0) {
      penalty = SECURITY.VULN_CRITICAL_PENALTY;
      breakdown.push({ label: `Critical vulnerability (CVSS ${cvss.toFixed(1)})`, delta: -penalty });
    } else if (cvss >= 7.0) {
      penalty = SECURITY.VULN_HIGH_PENALTY;
      breakdown.push({ label: `High-severity vulnerability (CVSS ${cvss.toFixed(1)})`, delta: -penalty });
    } else if (cvss >= 4.0) {
      penalty = SECURITY.VULN_MEDIUM_PENALTY;
      breakdown.push({ label: `Medium-severity vulnerability (CVSS ${cvss.toFixed(1)})`, delta: -penalty });
    } else {
      penalty = SECURITY.VULN_LOW_PENALTY;
      breakdown.push({ label: `Low-severity vulnerability (CVSS ${cvss.toFixed(1)})`, delta: -penalty });
    }

    // Additional penalty per extra vulnerability beyond the first
    if (data.knownVulnerabilities > 1) {
      const extraPenalty = Math.min((data.knownVulnerabilities - 1) * 5, 20);
      breakdown.push({
        label: `${data.knownVulnerabilities - 1} additional vulnerabilities`,
        delta: -extraPenalty,
      });
      penalty += extraPenalty;
    }

    score -= penalty;
  } else {
    breakdown.push({ label: 'No known vulnerabilities', delta: 0 });
  }

  // ── Outdated dependencies penalty ─────────────────────────────────────────
  if (data.outdatedDependencies > 0) {
    const outdatedPenalty = Math.min(
      data.outdatedDependencies * SECURITY.OUTDATED_DEPS_PENALTY_PER_DEP,
      SECURITY.OUTDATED_DEPS_MAX_PENALTY,
    );
    breakdown.push({ label: `${data.outdatedDependencies} outdated dependencies`, delta: -outdatedPenalty });
    score -= outdatedPenalty;
  }

  // ── Security release recency bonus/penalty ────────────────────────────────
  const secReleaseDays = data.daysSinceSecurityRelease;
  if (secReleaseDays !== Infinity) {
    const secReleasePoints = (() => {
      if (secReleaseDays <= SECURITY.SEC_RELEASE_EXCELLENT_DAYS) return SECURITY.SEC_RELEASE_MAX_POINTS;
      if (secReleaseDays <= SECURITY.SEC_RELEASE_GOOD_DAYS) {
        const ratio = (secReleaseDays - SECURITY.SEC_RELEASE_EXCELLENT_DAYS) /
          (SECURITY.SEC_RELEASE_GOOD_DAYS - SECURITY.SEC_RELEASE_EXCELLENT_DAYS);
        return Math.round(SECURITY.SEC_RELEASE_MAX_POINTS * (1 - ratio * 0.5));
      }
      return 0;
    })();
    // Note: this is only a bonus on top of the 100-base; don't double-count
    // We treat no-vuln base as 100, security release bonus only applies when score > 80
    if (score > 80 && secReleasePoints > 0) {
      breakdown.push({ label: 'Recent security release', delta: secReleasePoints });
      // Already baked into 100 base, no addition needed — just record for explainability
    }
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  return { score: finalScore, breakdown };
}
