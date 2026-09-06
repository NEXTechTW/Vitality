/**
 * `vitality analyze <owner/repo>` command
 */
import { writeFileSync } from 'node:fs';
import { collect } from '@vitality/collectors';
import { computeScore } from '@vitality/scoring-engine';
import { renderReport, renderBreakdown } from '../renderer/terminal.js';
import { assembleReport } from '../assembler.js';
export async function analyzeCommand(slug, options, spinner) {
    const [owner, repo] = slug.split('/');
    if (!owner || !repo) {
        throw new Error(`Invalid repository slug: "${slug}". Expected format: owner/repo`);
    }
    const token = options.token ?? process.env['GITHUB_TOKEN'] ?? '';
    if (!token) {
        throw new Error('A GitHub token is required. Set GITHUB_TOKEN env var or use --token flag.\n' +
            'Create a read-only token at: https://github.com/settings/tokens');
    }
    const windowDays = parseInt(options.window ?? '90', 10);
    // Step 1: Collect
    spinner.start(`Collecting data for ${owner}/${repo}…`);
    const normalized = await collect({ owner, repo, token, windowDays });
    spinner.succeed(`Data collected (${windowDays}d window)`);
    // Step 2: Score (pure deterministic function)
    spinner.start('Computing health score…');
    const result = computeScore(normalized);
    spinner.succeed('Score computed');
    // Step 3: Assemble vitality.json
    const report = assembleReport(result, {
        avgDaysBetweenReleases: normalized.releases.avgDaysBetweenReleases,
        releaseIntervalStdDev: normalized.releases.releaseIntervalStdDev,
        knownVulnerabilities: normalized.security.knownVulnerabilities,
        daysSinceSecurityRelease: normalized.security.daysSinceSecurityRelease === Infinity
            ? undefined
            : normalized.security.daysSinceSecurityRelease,
        activeContributors: normalized.community.activeContributors,
        contributorGrowthPct: normalized.community.contributorGrowthPct,
        contributorDiversityIndex: normalized.community.contributorDiversityIndex,
        issueResponse: normalized.maintenance.avgIssueFirstResponseHours,
        prResponse: normalized.maintenance.avgPrFirstReviewHours,
        backlogTrendPct: (normalized.maintenance.prBacklogTrendPct + normalized.maintenance.issueBacklogTrendPct) / 2,
        majorVersionBumps: normalized.releases.majorVersionBumps,
        totalReleases: normalized.releases.totalReleases,
    });
    // Step 4: Render
    process.stdout.write(renderReport(result));
    if (options.breakdown) {
        process.stdout.write(renderBreakdown(result));
    }
    // Step 5: Write vitality.json
    const outputPath = options.output ?? 'vitality.json';
    writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\n  Written to ${outputPath}\n`);
}
//# sourceMappingURL=analyze.js.map