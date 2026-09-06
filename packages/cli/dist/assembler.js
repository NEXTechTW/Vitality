/**
 * Report assembler — combines ScoringEngineOutput into the vitality.json format
 * and validates it against the JSON Schema before writing.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AjvModule from 'ajv';
import { existsSync } from 'node:fs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
function loadSchema() {
    const candidates = [
        path.resolve(__dirname, '../../../schemas/vitality.schema.json'),
        path.resolve(__dirname, '../../schemas/vitality.schema.json'),
        path.resolve(process.cwd(), 'schemas/vitality.schema.json'),
        path.resolve(process.cwd(), '../../schemas/vitality.schema.json'),
    ];
    for (const candidate of candidates) {
        if (existsSync(candidate)) {
            return JSON.parse(readFileSync(candidate, 'utf-8'));
        }
    }
    return { type: 'object', required: ['protocol_version', 'project', 'score'] };
}
const schema = loadSchema();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Ajv = (AjvModule.default ?? AjvModule);
const ajv = new Ajv({ strict: false, logger: false });
const validate = ajv.compile(schema);
function releaseFrequency(avgDays) {
    if (avgDays <= 30)
        return 'frequent';
    if (avgDays <= 90)
        return 'healthy';
    if (avgDays <= 180)
        return 'infrequent';
    return 'stale';
}
function releaseStability(stdDev) {
    if (stdDev <= 7)
        return 'high';
    if (stdDev <= 21)
        return 'medium';
    return 'low';
}
function depRisk(vuln) {
    if (vuln === 0)
        return 'none';
    if (vuln <= 2)
        return 'low';
    if (vuln <= 5)
        return 'medium';
    return 'high';
}
export function assembleReport(result, extra) {
    const report = {
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
                if (rate <= 0.05)
                    return 'none';
                if (rate <= 0.20)
                    return 'low';
                if (rate <= 0.40)
                    return 'medium';
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
        throw new Error(`vitality.json failed schema validation:\n${JSON.stringify(validate.errors, null, 2)}`);
    }
    return report;
}
//# sourceMappingURL=assembler.js.map