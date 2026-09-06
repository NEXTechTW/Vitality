const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;
/** Compute a Gini-like contributor diversity index (0 = monopoly, 1 = equal) */
function giniDiversity(commitCounts) {
    if (commitCounts.length === 0)
        return 0;
    if (commitCounts.length === 1)
        return 0;
    const sorted = [...commitCounts].sort((a, b) => a - b);
    const n = sorted.length;
    const total = sorted.reduce((s, v) => s + v, 0);
    if (total === 0)
        return 0;
    // Gini coefficient
    let numerator = 0;
    for (let i = 0; i < n; i++) {
        numerator += (2 * (i + 1) - n - 1) * (sorted[i] ?? 0);
    }
    const gini = numerator / (n * total);
    // Convert: gini=0 (equal) → diversity=1, gini=1 (monopoly) → diversity=0
    return Math.max(0, Math.min(1, 1 - gini));
}
/** Average of an array, returns 0 for empty */
function avg(vals) {
    if (vals.length === 0)
        return 0;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
}
/** Standard deviation of an array */
function stdDev(vals) {
    if (vals.length < 2)
        return 0;
    const mean = avg(vals);
    return Math.sqrt(avg(vals.map((v) => (v - mean) ** 2)));
}
export function normalize(raw) {
    const nowMs = Date.now();
    const sinceMs = nowMs - raw.windowDays * MS_PER_DAY;
    // ── Human contributors only ───────────────────────────────────────────────
    const humanContribs = raw.contributors.filter((c) => !c.isBot);
    const previousWindowContribs = raw.contributors.filter((c) => {
        const lastMs = new Date(c.lastCommitAt).getTime();
        return !c.isBot && lastMs < sinceMs && lastMs >= sinceMs - raw.windowDays * MS_PER_DAY;
    });
    // ── Maintenance ───────────────────────────────────────────────────────────
    const issueResponseDeltas = raw.issues
        .filter((i) => i.firstResponseAt !== null)
        .map((i) => (new Date(i.firstResponseAt).getTime() - new Date(i.createdAt).getTime()) / MS_PER_HOUR);
    const prReviewDeltas = raw.pullRequests
        .filter((pr) => pr.firstReviewAt !== null)
        .map((pr) => (new Date(pr.firstReviewAt).getTime() - new Date(pr.createdAt).getTime()) / MS_PER_HOUR);
    const closedIssues = raw.issues.filter((i) => i.state === 'CLOSED').length;
    const mergedPrs = raw.pullRequests.filter((pr) => pr.state === 'MERGED').length;
    const lastRelease = raw.releases.filter((r) => !r.isPrerelease)[0];
    const daysSinceLastRelease = lastRelease
        ? (nowMs - new Date(lastRelease.publishedAt).getTime()) / MS_PER_DAY
        : Infinity;
    // Backlog trend: ratio of open items now vs start of window (simplified)
    const openPrsNow = raw.pullRequests.filter((pr) => pr.state === 'OPEN').length;
    const openIssuesNow = raw.issues.filter((i) => i.state === 'OPEN').length;
    // Use a simple heuristic: if many are old and unclosed, backlog is growing
    const prBacklogTrendPct = openPrsNow > 0 ? Math.min(openPrsNow * 2, 50) : 0;
    const issueBacklogTrendPct = openIssuesNow > 0 ? Math.min(openIssuesNow * 0.5, 40) : 0;
    // ── Community ─────────────────────────────────────────────────────────────
    const commitCounts = humanContribs.map((c) => c.commitCount);
    const diversityIndex = giniDiversity(commitCounts);
    const prevContribLogins = new Set(previousWindowContribs.map((c) => c.login));
    const newContributors = humanContribs.filter((c) => !prevContribLogins.has(c.login)).length;
    const growthPct = previousWindowContribs.length > 0
        ? ((humanContribs.length - previousWindowContribs.length) / previousWindowContribs.length) * 100
        : 0;
    // ── Security ──────────────────────────────────────────────────────────────
    const maxCvss = raw.vulnerabilities.length > 0
        ? Math.max(...raw.vulnerabilities.map((v) => v.cvssScore))
        : 0;
    const securityReleases = raw.releases.filter((r) => /security|cve|vuln|patch/i.test(r.name ?? '') || /security|cve|vuln/i.test(r.descriptionHTML ?? ''));
    const lastSecRelease = securityReleases[0];
    const daysSinceSecurityRelease = lastSecRelease
        ? (nowMs - new Date(lastSecRelease.publishedAt).getTime()) / MS_PER_DAY
        : Infinity;
    const outdatedDependencies = raw.dependencies.filter((d) => {
        // Heuristic: version starts with 0.x or is significantly behind
        // Real outdatedness check would query npm/PyPI registry
        return d.version.startsWith('0.');
    }).length;
    // ── Releases ──────────────────────────────────────────────────────────────
    const stableReleases = raw.releases.filter((r) => !r.isPrerelease && !r.isDraft);
    const releaseTimestamps = stableReleases
        .map((r) => new Date(r.publishedAt).getTime())
        .sort((a, b) => a - b);
    const releaseIntervals = releaseTimestamps
        .slice(1)
        .map((ts, i) => (ts - (releaseTimestamps[i] ?? 0)) / MS_PER_DAY);
    const avgDaysBetweenReleases = avg(releaseIntervals);
    const releaseIntervalStdDev = stdDev(releaseIntervals);
    // Major version bumps: releases where tag looks like vN.0.0
    const majorBumps = stableReleases.filter((r) => /^v?\d+\.0\.0/.test(r.tagName)).length;
    const projectAgeDays = (nowMs - raw.createdAtMs) / MS_PER_DAY;
    return {
        project: `${raw.owner}/${raw.repo}`,
        windowDays: raw.windowDays,
        maintenance: {
            avgIssueFirstResponseHours: avg(issueResponseDeltas),
            issueResolutionRate: raw.issues.length > 0 ? closedIssues / raw.issues.length : 0,
            avgPrFirstReviewHours: avg(prReviewDeltas),
            prMergeRate: raw.pullRequests.length > 0 ? mergedPrs / raw.pullRequests.length : 0,
            daysSinceLastRelease,
            releasesInWindow: stableReleases.length,
            prBacklogTrendPct,
            issueBacklogTrendPct,
        },
        community: {
            activeContributors: humanContribs.length,
            contributorGrowthPct: growthPct,
            contributorDiversityIndex: diversityIndex,
            newContributors,
            totalHumanCommits: commitCounts.reduce((s, v) => s + v, 0),
        },
        security: {
            knownVulnerabilities: raw.vulnerabilities.length,
            maxCvssScore: maxCvss,
            daysSinceSecurityRelease,
            totalDependencies: raw.dependencies.length,
            outdatedDependencies,
        },
        releases: {
            avgDaysBetweenReleases,
            releaseIntervalStdDev,
            majorVersionBumps: majorBumps,
            totalReleases: stableReleases.length,
            projectAgeDays,
        },
    };
}
//# sourceMappingURL=normalizer.js.map