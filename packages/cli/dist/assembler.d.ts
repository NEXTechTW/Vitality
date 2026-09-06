import type { ScoringEngineOutput } from '@vitality/scoring-engine';
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
        breakdown: {
            label: string;
            delta: number;
        }[];
    };
    community: {
        score: number;
        active_contributors?: number | undefined;
        contributor_growth?: number | undefined;
        contributor_diversity_index?: number | undefined;
        breakdown: {
            label: string;
            delta: number;
        }[];
    };
    security: {
        score: number;
        known_vulnerabilities?: number | undefined;
        dependency_risk?: string | undefined;
        last_security_release_days_ago?: number | undefined;
        breakdown: {
            label: string;
            delta: number;
        }[];
    };
    releases: {
        score: number;
        frequency?: string | undefined;
        stability?: string | undefined;
        breaking_change_rate?: string | undefined;
        breakdown: {
            label: string;
            delta: number;
        }[];
    };
    provenance: {
        data_sources: string[];
        computation_hash: string;
        reproducible: boolean;
        algorithm_version: string;
    };
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
export declare function assembleReport(result: ScoringEngineOutput, extra?: ExtraMetrics): VitalityReport;
//# sourceMappingURL=assembler.d.ts.map