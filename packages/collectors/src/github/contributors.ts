/**
 * Contributors Collector
 * Fetches commit authors. Bot accounts are flagged via GitHub's __typename check.
 */
import type { GitHubClient } from './client.js';
import type { RawContributor } from '../types.js';

const CONTRIBUTORS_QUERY = `
  query GetContributors($owner: String!, $repo: String!, $branch: String!, $first: Int!, $after: String) {
    repository(owner: $owner, name: $repo) {
      ref(qualifiedName: $branch) {
        target {
          ... on Commit {
            history(first: $first, after: $after) {
              nodes {
                committedDate
                author {
                  user {
                    login
                    __typename
                  }
                  name
                }
              }
              pageInfo { hasNextPage endCursor }
            }
          }
        }
      }
    }
  }
`;

interface GHCommitNode {
  committedDate: string;
  author: {
    user: { login: string; __typename: string } | null;
    name: string | null;
  };
}

const BOT_PATTERNS = /\[bot\]|dependabot|renovate|github-actions|semantic-release/i;

export async function collectContributors(
  client: GitHubClient,
  owner: string,
  repo: string,
  branch: string,
  sinceMs: number,
): Promise<RawContributor[]> {
  const authorMap = new Map<string, { commitCount: number; firstCommitAt: string; lastCommitAt: string; isBot: boolean }>();

  for await (const page of client.paginate(
    (cursor) => ({ query: CONTRIBUTORS_QUERY, variables: { owner, repo, branch, after: cursor } }),
    (data: unknown) => {
      const d = data as { repository: { ref: { target: { history: { nodes: GHCommitNode[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } } } } };
      const history = d.repository.ref?.target?.history;
      return { nodes: history?.nodes ?? [], pageInfo: history?.pageInfo ?? { hasNextPage: false, endCursor: null } };
    },
  )) {
    for (const node of page) {
      const commitMs = new Date(node.committedDate).getTime();
      if (commitMs < sinceMs) return buildResult(authorMap);

      const login = node.author.user?.login ?? node.author.name ?? 'unknown';
      const isBot = BOT_PATTERNS.test(login);
      const existing = authorMap.get(login);

      if (existing) {
        existing.commitCount++;
        if (node.committedDate < existing.firstCommitAt) existing.firstCommitAt = node.committedDate;
        if (node.committedDate > existing.lastCommitAt) existing.lastCommitAt = node.committedDate;
      } else {
        authorMap.set(login, {
          commitCount: 1,
          firstCommitAt: node.committedDate,
          lastCommitAt: node.committedDate,
          isBot,
        });
      }
    }
  }

  return buildResult(authorMap);
}

function buildResult(
  authorMap: Map<string, { commitCount: number; firstCommitAt: string; lastCommitAt: string; isBot: boolean }>,
): RawContributor[] {
  return Array.from(authorMap.entries()).map(([login, data]) => ({ login, ...data }));
}
