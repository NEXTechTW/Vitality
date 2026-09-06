/**
 * Normalizer — converts raw RawRepoData into clean NormalizedRepoData
 * for the scoring engine.
 *
 * This is where "real-world messiness" is absorbed:
 * - Timestamps → relative durations
 * - Rolling window applied
 * - Bots deduplicated
 * - Diversity index computed
 */
import type { RawRepoData } from './types.js';
import type { NormalizedRepoData } from '@vitality/scoring-engine';
export declare function normalize(raw: RawRepoData): NormalizedRepoData;
//# sourceMappingURL=normalizer.d.ts.map