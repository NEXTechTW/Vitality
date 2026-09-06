/**
 * Contributors Collector
 * Fetches commit authors. Bot accounts are flagged via GitHub's __typename check.
 */
import type { GitHubClient } from './client.js';
import type { RawContributor } from '../types.js';
export declare function collectContributors(client: GitHubClient, owner: string, repo: string, branch: string, sinceMs: number): Promise<RawContributor[]>;
//# sourceMappingURL=contributors.d.ts.map