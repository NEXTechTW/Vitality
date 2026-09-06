/**
 * Dependency Collector
 * Reads package manifests from the repository via GitHub API (no code execution).
 */
import type { GitHubClient } from './client.js';
import type { RawDependency } from '../types.js';
export declare function collectDependencies(client: GitHubClient, owner: string, repo: string, branch: string): Promise<RawDependency[]>;
//# sourceMappingURL=dependencies.d.ts.map