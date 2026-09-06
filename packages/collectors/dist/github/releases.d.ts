/**
 * Releases Collector — fetches release history from GitHub GraphQL API.
 */
import type { GitHubClient } from './client.js';
import type { RawRelease } from '../types.js';
export declare function collectReleases(client: GitHubClient, owner: string, repo: string, sinceMs: number): Promise<RawRelease[]>;
//# sourceMappingURL=releases.d.ts.map