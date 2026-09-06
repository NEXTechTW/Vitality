const ISSUES_QUERY = `
  query GetIssues($owner: String!, $repo: String!, $first: Int!, $after: String) {
    repository(owner: $owner, name: $repo) {
      issues(first: $first, after: $after, orderBy: { field: CREATED_AT, direction: DESC }, states: [OPEN, CLOSED]) {
        nodes {
          number
          createdAt
          closedAt
          state
          author { login }
          labels(first: 10) { nodes { name } }
          comments(first: 1, orderBy: { field: UPDATED_AT, direction: ASC }) {
            nodes {
              createdAt
              author { login }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;
export async function collectIssues(client, owner, repo, sinceMs) {
    const issues = [];
    for await (const page of client.paginate((cursor) => ({ query: ISSUES_QUERY, variables: { owner, repo, after: cursor } }), (data) => {
        const d = data;
        return { nodes: d.repository.issues.nodes, pageInfo: d.repository.issues.pageInfo };
    })) {
        for (const node of page) {
            const createdMs = new Date(node.createdAt).getTime();
            if (createdMs < sinceMs)
                return issues;
            const authorLogin = node.author?.login ?? 'ghost';
            // First response = first comment NOT by the original author
            const firstResponseComment = node.comments.nodes.find((c) => c.author?.login !== authorLogin);
            issues.push({
                number: node.number,
                createdAt: node.createdAt,
                closedAt: node.closedAt,
                state: node.state,
                labels: node.labels.nodes.map((l) => l.name),
                firstResponseAt: firstResponseComment?.createdAt ?? null,
                authorLogin,
            });
        }
    }
    return issues;
}
//# sourceMappingURL=issues.js.map