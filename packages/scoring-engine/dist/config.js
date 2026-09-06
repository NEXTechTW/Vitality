/**
 * Vitality Scoring Engine — Configuration
 *
 * ALL weights and thresholds are defined here as named constants.
 * They are NEVER scattered across individual scoring functions.
 *
 * Any change to values in this file MUST be accompanied by a corresponding
 * entry in docs/SCORING_CHANGELOG.md with before/after impact on the benchmark repo set.
 */
// ─────────────────────────────────────────────────────────────────────────────
// Algorithm version — bumped on any weight or threshold change
// ─────────────────────────────────────────────────────────────────────────────
export const ALGORITHM_VERSION = '1.0.0';
// ─────────────────────────────────────────────────────────────────────────────
// Dimension weights (must sum to 1.0)
// ─────────────────────────────────────────────────────────────────────────────
export const DIMENSION_WEIGHTS = {
    maintenance: 0.35,
    community: 0.25,
    security: 0.25,
    releases: 0.15,
};
// ─────────────────────────────────────────────────────────────────────────────
// Maintenance thresholds
// ─────────────────────────────────────────────────────────────────────────────
export const MAINTENANCE = {
    // Issue first response
    ISSUE_RESPONSE_EXCELLENT_HOURS: 24, // ≤24h → full points
    ISSUE_RESPONSE_GOOD_HOURS: 72, // ≤72h → partial
    ISSUE_RESPONSE_POOR_HOURS: 336, // ≤336h (14d) → minimal
    // Points allocation
    ISSUE_RESPONSE_MAX_POINTS: 25,
    // PR first review
    PR_REVIEW_EXCELLENT_HOURS: 48,
    PR_REVIEW_GOOD_HOURS: 120,
    PR_REVIEW_POOR_HOURS: 336,
    PR_REVIEW_MAX_POINTS: 25,
    // PR merge rate
    PR_MERGE_RATE_MAX_POINTS: 15,
    // Issue resolution rate
    ISSUE_RESOLUTION_RATE_MAX_POINTS: 15,
    // Release recency
    RELEASE_RECENCY_EXCELLENT_DAYS: 30, // released within 30d → full
    RELEASE_RECENCY_GOOD_DAYS: 90,
    RELEASE_RECENCY_POOR_DAYS: 180,
    RELEASE_RECENCY_MAX_POINTS: 10,
    // Backlog trend penalty
    BACKLOG_TREND_PENALTY_PER_10PCT: 2, // -2 points for every 10% backlog growth
    BACKLOG_TREND_MAX_PENALTY: 10,
};
// ─────────────────────────────────────────────────────────────────────────────
// Community thresholds
// ─────────────────────────────────────────────────────────────────────────────
export const COMMUNITY = {
    // Active contributor count
    CONTRIBUTORS_EXCELLENT: 10,
    CONTRIBUTORS_GOOD: 5,
    CONTRIBUTORS_POOR: 2,
    CONTRIBUTORS_MAX_POINTS: 35,
    // Diversity index
    DIVERSITY_MAX_POINTS: 30,
    // Contributor growth
    GROWTH_EXCELLENT_PCT: 20, // ≥20% growth → full
    GROWTH_GOOD_PCT: 5,
    GROWTH_NEGATIVE_PENALTY: 5, // penalty for shrinking contributor base
    GROWTH_MAX_POINTS: 20,
    // New contributors
    NEW_CONTRIBUTORS_MAX_POINTS: 15,
    NEW_CONTRIBUTORS_EXCELLENT: 3,
};
// ─────────────────────────────────────────────────────────────────────────────
// Security thresholds
// ─────────────────────────────────────────────────────────────────────────────
export const SECURITY = {
    // Vulnerability penalties
    VULN_CRITICAL_PENALTY: 40, // critical CVE (CVSS ≥9)
    VULN_HIGH_PENALTY: 25, // high (CVSS 7–8.9)
    VULN_MEDIUM_PENALTY: 10, // medium (CVSS 4–6.9)
    VULN_LOW_PENALTY: 3, // low (CVSS <4)
    // Dependency risk
    OUTDATED_DEPS_PENALTY_PER_DEP: 2,
    OUTDATED_DEPS_MAX_PENALTY: 20,
    // Security release recency
    SEC_RELEASE_EXCELLENT_DAYS: 30,
    SEC_RELEASE_GOOD_DAYS: 90,
    SEC_RELEASE_MAX_POINTS: 20,
    // Base score when no vulnerabilities
    NO_VULN_BASE_SCORE: 100,
};
// ─────────────────────────────────────────────────────────────────────────────
// Releases thresholds
// ─────────────────────────────────────────────────────────────────────────────
export const RELEASES = {
    // Cadence
    CADENCE_EXCELLENT_DAYS: 30, // avg ≤30d between releases
    CADENCE_GOOD_DAYS: 90,
    CADENCE_POOR_DAYS: 180,
    CADENCE_MAX_POINTS: 40,
    // Cadence stability (lower std dev = more stable)
    STABILITY_MAX_POINTS: 30,
    STABILITY_EXCELLENT_STD_DEV: 7, // ≤7d std dev
    STABILITY_GOOD_STD_DEV: 21,
    // Breaking change rate
    BREAKING_CHANGE_MAX_POINTS: 30,
    BREAKING_CHANGE_EXCELLENT_RATE: 0.05, // ≤5% of releases are major bumps
    BREAKING_CHANGE_GOOD_RATE: 0.20,
};
//# sourceMappingURL=config.js.map