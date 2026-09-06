import { GitHubClient } from './github/client.js';
import { collectReleases } from './github/releases.js';
import { collectIssues } from './github/issues.js';
import { collectPullRequests } from './github/pull-requests.js';
import { collectContributors } from './github/contributors.js';
import { collectDependencies } from './github/dependencies.js';
import { collectVulnerabilities } from './osv/client.js';
import { normalize } from './normalizer.js';
const REPO_META_QUERY = `
  query GetRepoMeta($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      createdAt
      defaultBranchRef { name }
    }
  }
`;
/**
 * Collect and normalize all data for a GitHub repository.
 * This is the single entry point for the collectors package.
 * Output: NormalizedRepoData ready for the scoring engine.
 */
export async function collect(options) {
    const { owner, repo, token, windowDays = 90 } = options;
    const client = new GitHubClient({ token });
    const nowMs = Date.now();
    const sinceMs = nowMs - windowDays * 86_400_000;
    // Fetch repo metadata (created date, default branch)
    const meta = await client.query(REPO_META_QUERY, { owner, repo });
    const createdAtMs = new Date(meta.repository.createdAt).getTime();
    const defaultBranch = meta.repository.defaultBranchRef?.name ?? 'main';
    // Collect all data in parallel where possible
    const [releases, issues, pullRequests, contributors, dependencies] = await Promise.all([
        collectReleases(client, owner, repo, sinceMs),
        collectIssues(client, owner, repo, sinceMs),
        collectPullRequests(client, owner, repo, sinceMs),
        collectContributors(client, owner, repo, defaultBranch, sinceMs),
        collectDependencies(client, owner, repo, defaultBranch),
    ]);
    // OSV vulnerability lookup depends on dependencies list
    const vulnerabilities = await collectVulnerabilities(dependencies);
    const raw = {
        owner,
        repo,
        collectedAt: new Date().toISOString(),
        windowDays,
        releases,
        issues,
        pullRequests,
        contributors,
        dependencies,
        vulnerabilities,
        createdAtMs,
        defaultBranch,
    };
    return normalize(raw);
}
//# sourceMappingURL=index.js.map