/**
 * Vitality Scoring Engine — Configuration
 *
 * ALL weights and thresholds are defined here as named constants.
 * They are NEVER scattered across individual scoring functions.
 *
 * Any change to values in this file MUST be accompanied by a corresponding
 * entry in docs/SCORING_CHANGELOG.md with before/after impact on the benchmark repo set.
 */
export declare const ALGORITHM_VERSION = "1.0.0";
export declare const DIMENSION_WEIGHTS: {
    readonly maintenance: 0.35;
    readonly community: 0.25;
    readonly security: 0.25;
    readonly releases: 0.15;
};
export declare const MAINTENANCE: {
    readonly ISSUE_RESPONSE_EXCELLENT_HOURS: 24;
    readonly ISSUE_RESPONSE_GOOD_HOURS: 72;
    readonly ISSUE_RESPONSE_POOR_HOURS: 336;
    readonly ISSUE_RESPONSE_MAX_POINTS: 25;
    readonly PR_REVIEW_EXCELLENT_HOURS: 48;
    readonly PR_REVIEW_GOOD_HOURS: 120;
    readonly PR_REVIEW_POOR_HOURS: 336;
    readonly PR_REVIEW_MAX_POINTS: 25;
    readonly PR_MERGE_RATE_MAX_POINTS: 15;
    readonly ISSUE_RESOLUTION_RATE_MAX_POINTS: 15;
    readonly RELEASE_RECENCY_EXCELLENT_DAYS: 30;
    readonly RELEASE_RECENCY_GOOD_DAYS: 90;
    readonly RELEASE_RECENCY_POOR_DAYS: 180;
    readonly RELEASE_RECENCY_MAX_POINTS: 10;
    readonly BACKLOG_TREND_PENALTY_PER_10PCT: 2;
    readonly BACKLOG_TREND_MAX_PENALTY: 10;
};
export declare const COMMUNITY: {
    readonly CONTRIBUTORS_EXCELLENT: 10;
    readonly CONTRIBUTORS_GOOD: 5;
    readonly CONTRIBUTORS_POOR: 2;
    readonly CONTRIBUTORS_MAX_POINTS: 35;
    readonly DIVERSITY_MAX_POINTS: 30;
    readonly GROWTH_EXCELLENT_PCT: 20;
    readonly GROWTH_GOOD_PCT: 5;
    readonly GROWTH_NEGATIVE_PENALTY: 5;
    readonly GROWTH_MAX_POINTS: 20;
    readonly NEW_CONTRIBUTORS_MAX_POINTS: 15;
    readonly NEW_CONTRIBUTORS_EXCELLENT: 3;
};
export declare const SECURITY: {
    readonly VULN_CRITICAL_PENALTY: 40;
    readonly VULN_HIGH_PENALTY: 25;
    readonly VULN_MEDIUM_PENALTY: 10;
    readonly VULN_LOW_PENALTY: 3;
    readonly OUTDATED_DEPS_PENALTY_PER_DEP: 2;
    readonly OUTDATED_DEPS_MAX_PENALTY: 20;
    readonly SEC_RELEASE_EXCELLENT_DAYS: 30;
    readonly SEC_RELEASE_GOOD_DAYS: 90;
    readonly SEC_RELEASE_MAX_POINTS: 20;
    readonly NO_VULN_BASE_SCORE: 100;
};
export declare const RELEASES: {
    readonly CADENCE_EXCELLENT_DAYS: 30;
    readonly CADENCE_GOOD_DAYS: 90;
    readonly CADENCE_POOR_DAYS: 180;
    readonly CADENCE_MAX_POINTS: 40;
    readonly STABILITY_MAX_POINTS: 30;
    readonly STABILITY_EXCELLENT_STD_DEV: 7;
    readonly STABILITY_GOOD_STD_DEV: 21;
    readonly BREAKING_CHANGE_MAX_POINTS: 30;
    readonly BREAKING_CHANGE_EXCELLENT_RATE: 0.05;
    readonly BREAKING_CHANGE_GOOD_RATE: 0.2;
};
//# sourceMappingURL=config.d.ts.map