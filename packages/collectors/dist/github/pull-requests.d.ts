/**
 * Pull Requests Collector
 */
import type { GitHubClient } from './client.js';
import type { RawPullRequest } from '../types.js';
export declare function collectPullRequests(client: GitHubClient, owner: string, repo: string, sinceMs: number): Promise<RawPullRequest[]>;
//# sourceMappingURL=pull-requests.d.ts.map