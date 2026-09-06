/**
 * Main collector entry point.
 * Orchestrates all GitHub + OSV data collection and normalization.
 */
import type { NormalizedRepoData } from '@vitality/scoring-engine';
export interface CollectOptions {
    owner: string;
    repo: string;
    token: string;
    windowDays?: number;
}
/**
 * Collect and normalize all data for a GitHub repository.
 * This is the single entry point for the collectors package.
 * Output: NormalizedRepoData ready for the scoring engine.
 */
export declare function collect(options: CollectOptions): Promise<NormalizedRepoData>;
export type { RawRepoData } from './types.js';
//# sourceMappingURL=index.d.ts.map