import { RELEASES } from '../config.js';
export function scoreReleases(data) {
    const breakdown = [];
    let total = 0;
    // ── Cadence ───────────────────────────────────────────────────────────────
    // Projects with zero releases in the window get 0 cadence points.
    const cadencePoints = (() => {
        if (data.totalReleases === 0) {
            breakdown.push({ label: 'No releases in analysis window', delta: 0 });
            return 0;
        }
        const avg = data.avgDaysBetweenReleases;
        if (avg <= RELEASES.CADENCE_EXCELLENT_DAYS)
            return RELEASES.CADENCE_MAX_POINTS;
        if (avg <= RELEASES.CADENCE_GOOD_DAYS) {
            const ratio = (avg - RELEASES.CADENCE_EXCELLENT_DAYS) /
                (RELEASES.CADENCE_GOOD_DAYS - RELEASES.CADENCE_EXCELLENT_DAYS);
            return Math.round(RELEASES.CADENCE_MAX_POINTS * (1 - ratio * 0.4));
        }
        if (avg <= RELEASES.CADENCE_POOR_DAYS) {
            const ratio = (avg - RELEASES.CADENCE_GOOD_DAYS) /
                (RELEASES.CADENCE_POOR_DAYS - RELEASES.CADENCE_GOOD_DAYS);
            return Math.round(RELEASES.CADENCE_MAX_POINTS * (0.6 - ratio * 0.5));
        }
        return Math.round(RELEASES.CADENCE_MAX_POINTS * 0.1);
    })();
    breakdown.push({ label: 'Release cadence', delta: cadencePoints });
    total += cadencePoints;
    // ── Cadence stability ─────────────────────────────────────────────────────
    const stabilityPoints = (() => {
        if (data.totalReleases < 2) {
            // Not enough data to judge stability
            return Math.round(RELEASES.STABILITY_MAX_POINTS * 0.5);
        }
        const std = data.releaseIntervalStdDev;
        if (std <= RELEASES.STABILITY_EXCELLENT_STD_DEV)
            return RELEASES.STABILITY_MAX_POINTS;
        if (std <= RELEASES.STABILITY_GOOD_STD_DEV) {
            const ratio = (std - RELEASES.STABILITY_EXCELLENT_STD_DEV) /
                (RELEASES.STABILITY_GOOD_STD_DEV - RELEASES.STABILITY_EXCELLENT_STD_DEV);
            return Math.round(RELEASES.STABILITY_MAX_POINTS * (1 - ratio * 0.5));
        }
        return Math.round(RELEASES.STABILITY_MAX_POINTS * 0.2);
    })();
    breakdown.push({ label: 'Release cadence stability', delta: stabilityPoints });
    total += stabilityPoints;
    // ── Breaking change rate ──────────────────────────────────────────────────
    const breakingPoints = (() => {
        if (data.totalReleases === 0)
            return Math.round(RELEASES.BREAKING_CHANGE_MAX_POINTS * 0.5);
        const rate = data.majorVersionBumps / data.totalReleases;
        if (rate <= RELEASES.BREAKING_CHANGE_EXCELLENT_RATE)
            return RELEASES.BREAKING_CHANGE_MAX_POINTS;
        if (rate <= RELEASES.BREAKING_CHANGE_GOOD_RATE) {
            const ratio = (rate - RELEASES.BREAKING_CHANGE_EXCELLENT_RATE) /
                (RELEASES.BREAKING_CHANGE_GOOD_RATE - RELEASES.BREAKING_CHANGE_EXCELLENT_RATE);
            return Math.round(RELEASES.BREAKING_CHANGE_MAX_POINTS * (1 - ratio * 0.6));
        }
        return Math.round(RELEASES.BREAKING_CHANGE_MAX_POINTS * 0.1);
    })();
    breakdown.push({ label: 'Breaking change rate (major version bumps)', delta: breakingPoints });
    total += breakingPoints;
    // ── Project maturity context ──────────────────────────────────────────────
    // Very young projects (<90 days) get a small buffer — no cadence history yet
    if (data.projectAgeDays < 90 && data.totalReleases === 0) {
        const maturityBuffer = 10;
        breakdown.push({ label: 'Early-stage project (no cadence history yet)', delta: maturityBuffer });
        total += maturityBuffer;
    }
    const score = Math.max(0, Math.min(100, Math.round(total)));
    return { score, breakdown };
}
//# sourceMappingURL=releases.js.map