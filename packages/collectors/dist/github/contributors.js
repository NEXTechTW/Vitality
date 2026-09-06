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
const BOT_PATTERNS = /\[bot\]|dependabot|renovate|github-actions|semantic-release/i;
export async function collectContributors(client, owner, repo, branch, sinceMs) {
    const authorMap = new Map();
    for await (const page of client.paginate((cursor) => ({ query: CONTRIBUTORS_QUERY, variables: { owner, repo, branch, after: cursor } }), (data) => {
        const d = data;
        const history = d.repository.ref?.target?.history;
        return { nodes: history?.nodes ?? [], pageInfo: history?.pageInfo ?? { hasNextPage: false, endCursor: null } };
    })) {
        for (const node of page) {
            const commitMs = new Date(node.committedDate).getTime();
            if (commitMs < sinceMs)
                return buildResult(authorMap);
            const login = node.author.user?.login ?? node.author.name ?? 'unknown';
            const isBot = BOT_PATTERNS.test(login);
            const existing = authorMap.get(login);
            if (existing) {
                existing.commitCount++;
                if (node.committedDate < existing.firstCommitAt)
                    existing.firstCommitAt = node.committedDate;
                if (node.committedDate > existing.lastCommitAt)
                    existing.lastCommitAt = node.committedDate;
            }
            else {
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
function buildResult(authorMap) {
    return Array.from(authorMap.entries()).map(([login, data]) => ({ login, ...data }));
}
//# sourceMappingURL=contributors.js.map