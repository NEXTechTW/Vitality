/**
 * Pull Requests Collector
 */
import type { GitHubClient } from './client.js';
import type { RawPullRequest } from '../types.js';

const PRS_QUERY = `
  query GetPRs($owner: String!, $repo: String!, $first: Int!, $after: String) {
    repository(owner: $owner, name: $repo) {
      pullRequests(first: $first, after: $after, orderBy: { field: CREATED_AT, direction: DESC }, states: [OPEN, CLOSED, MERGED]) {
        nodes {
          number
          createdAt
          mergedAt
          closedAt
          state
          author { login }
          additions
          deletions
          changedFiles
          reviews(first: 1, states: [APPROVED, CHANGES_REQUESTED, COMMENTED]) {
            nodes { createdAt }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

interface GHPRNode {
  number: number;
  createdAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  state: 'OPEN' | 'CLOSED' | 'MERGED';
  author: { login: string } | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  reviews: { nodes: { createdAt: string }[] };
}

export async function collectPullRequests(
  client: GitHubClient,
  owner: string,
  repo: string,
  sinceMs: number,
): Promise<RawPullRequest[]> {
  const prs: RawPullRequest[] = [];

  for await (const page of client.paginate(
    (cursor) => ({ query: PRS_QUERY, variables: { owner, repo, after: cursor } }),
    (data: unknown) => {
      const d = data as { repository: { pullRequests: { nodes: GHPRNode[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } } };
      return { nodes: d.repository.pullRequests.nodes, pageInfo: d.repository.pullRequests.pageInfo };
    },
  )) {
    for (const node of page) {
      const createdMs = new Date(node.createdAt).getTime();
      if (createdMs < sinceMs) return prs;

      prs.push({
        number: node.number,
        createdAt: node.createdAt,
        mergedAt: node.mergedAt,
        closedAt: node.closedAt,
        state: node.state,
        authorLogin: node.author?.login ?? 'ghost',
        firstReviewAt: node.reviews.nodes[0]?.createdAt ?? null,
        additions: node.additions,
        deletions: node.deletions,
        changedFiles: node.changedFiles,
      });
    }
  }

  return prs;
}
