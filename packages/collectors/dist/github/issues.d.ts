/**
 * Issues Collector — fetches issue events from GitHub GraphQL API.
 */
import type { GitHubClient } from './client.js';
import type { RawIssue } from '../types.js';
export declare function collectIssues(client: GitHubClient, owner: string, repo: string, sinceMs: number): Promise<RawIssue[]>;
//# sourceMappingURL=issues.d.ts.map