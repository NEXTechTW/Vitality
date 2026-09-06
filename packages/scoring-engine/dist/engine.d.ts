import type { NormalizedRepoData, ScoringEngineOutput } from './types.js';
/**
 * Compute the Vitality health score for a repository.
 *
 * This is a pure function:
 * - Given the same NormalizedRepoData, it always produces the same output.
 * - It makes no network calls.
 * - It reads no files.
 * - It calls no LLMs.
 *
 * @param data - Normalized repository data from the collectors/normalizer layer
 * @returns Full scoring output including per-dimension breakdowns and computation hash
 */
export declare function computeScore(data: NormalizedRepoData): ScoringEngineOutput;
//# sourceMappingURL=engine.d.ts.map