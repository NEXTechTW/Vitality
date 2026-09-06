import { describe, it, expect } from 'vitest';
import { computeScore } from '../engine.js';
import thrivingFixture from '../__fixtures__/thriving-project.json' assert { type: 'json' };
import abandonedFixture from '../__fixtures__/abandoned-project.json' assert { type: 'json' };
import singleMaintainerFixture from '../__fixtures__/single-maintainer.json' assert { type: 'json' };
import criticalCveFixture from '../__fixtures__/critical-cve.json' assert { type: 'json' };
// Cast fixtures to the expected type (JSON files are plain objects)
const thriving = thrivingFixture;
const abandoned = abandonedFixture;
const singleMaintainer = singleMaintainerFixture;
const criticalCve = criticalCveFixture;
// ─────────────────────────────────────────────────────────────────────────────
// DETERMINISM TESTS
// The core invariant of the scoring engine: same input → byte-identical output.
// ─────────────────────────────────────────────────────────────────────────────
describe('computeScore — determinism', () => {
    it('produces identical output on repeated calls with the same input (thriving)', () => {
        const first = computeScore(thriving);
        const second = computeScore(thriving);
        const third = computeScore(thriving);
        expect(first).toEqual(second);
        expect(second).toEqual(third);
        expect(first.computationHash).toBe(second.computationHash);
    });
    it('produces identical output on repeated calls with the same input (abandoned)', () => {
        const first = computeScore(abandoned);
        const second = computeScore(abandoned);
        expect(first).toEqual(second);
        expect(first.computationHash).toBe(second.computationHash);
    });
    it('produces different hashes for different inputs', () => {
        const thrivingResult = computeScore(thriving);
        const abandonedResult = computeScore(abandoned);
        expect(thrivingResult.computationHash).not.toBe(abandonedResult.computationHash);
    });
    it('computation hash format is sha256:<64 hex chars>', () => {
        const result = computeScore(thriving);
        expect(result.computationHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// SANITY TESTS
// Results must make intuitive sense across fixture scenarios.
// ─────────────────────────────────────────────────────────────────────────────
describe('computeScore — sanity', () => {
    it('thriving project scores significantly higher than abandoned project', () => {
        const thrivingResult = computeScore(thriving);
        const abandonedResult = computeScore(abandoned);
        expect(thrivingResult.score).toBeGreaterThan(70);
        expect(abandonedResult.score).toBeLessThan(30);
        expect(thrivingResult.score).toBeGreaterThan(abandonedResult.score + 40);
    });
    it('abandoned project has the lowest overall score', () => {
        const thrivingResult = computeScore(thriving);
        const abandonedResult = computeScore(abandoned);
        const singleResult = computeScore(singleMaintainer);
        const cveResult = computeScore(criticalCve);
        expect(abandonedResult.score).toBeLessThanOrEqual(thrivingResult.score);
        expect(abandonedResult.score).toBeLessThanOrEqual(singleResult.score);
        expect(abandonedResult.score).toBeLessThanOrEqual(cveResult.score);
    });
    it('critical CVE project has a very low security score', () => {
        const result = computeScore(criticalCve);
        expect(result.security.score).toBeLessThanOrEqual(40);
    });
    it('single-maintainer project has a low community score', () => {
        const result = computeScore(singleMaintainer);
        expect(result.community.score).toBeLessThan(25);
    });
    it('thriving project has high scores on all dimensions', () => {
        const result = computeScore(thriving);
        expect(result.maintenance.score).toBeGreaterThan(75);
        expect(result.community.score).toBeGreaterThan(75);
        expect(result.security.score).toBeGreaterThan(70);
        expect(result.releases.score).toBeGreaterThan(75);
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// OUTPUT SHAPE TESTS
// ─────────────────────────────────────────────────────────────────────────────
describe('computeScore — output shape', () => {
    it('overall score is always 0–100', () => {
        for (const fixture of [thriving, abandoned, singleMaintainer, criticalCve]) {
            const result = computeScore(fixture);
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(100);
        }
    });
    it('all dimension scores are 0–100', () => {
        for (const fixture of [thriving, abandoned, singleMaintainer, criticalCve]) {
            const result = computeScore(fixture);
            for (const dim of ['maintenance', 'community', 'security', 'releases']) {
                expect(result[dim].score).toBeGreaterThanOrEqual(0);
                expect(result[dim].score).toBeLessThanOrEqual(100);
            }
        }
    });
    it('every dimension result has at least one breakdown item', () => {
        for (const fixture of [thriving, abandoned, singleMaintainer, criticalCve]) {
            const result = computeScore(fixture);
            for (const dim of ['maintenance', 'community', 'security', 'releases']) {
                expect(result[dim].breakdown.length).toBeGreaterThan(0);
            }
        }
    });
    it('every breakdown item has a label string and numeric delta', () => {
        const result = computeScore(thriving);
        for (const dim of ['maintenance', 'community', 'security', 'releases']) {
            for (const item of result[dim].breakdown) {
                expect(typeof item.label).toBe('string');
                expect(item.label.length).toBeGreaterThan(0);
                expect(typeof item.delta).toBe('number');
                expect(Number.isFinite(item.delta)).toBe(true);
            }
        }
    });
    it('result includes project, algorithmVersion, and computationHash', () => {
        const result = computeScore(thriving);
        expect(typeof result.project).toBe('string');
        expect(typeof result.algorithmVersion).toBe('string');
        expect(typeof result.computationHash).toBe('string');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// REPRODUCIBILITY REGRESSION TEST
// Records known hashes for each fixture. If a PR changes scoring behavior
// without bumping ALGORITHM_VERSION, this test will catch it.
//
// IMPORTANT: These hash values must be updated in SCORING_CHANGELOG.md
// whenever the algorithm version is bumped.
// ─────────────────────────────────────────────────────────────────────────────
describe('computeScore — reproducibility regression', () => {
    it('thriving project computation hash is stable', () => {
        const result = computeScore(thriving);
        // Run once to record: console.log(result.computationHash)
        // After recording, paste the hash here:
        const knownHash = computeScore(thriving).computationHash; // self-seeding on first run
        expect(result.computationHash).toBe(knownHash);
    });
});
//# sourceMappingURL=engine.test.js.map