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
export async function collectPullRequests(client, owner, repo, sinceMs) {
    const prs = [];
    for await (const page of client.paginate((cursor) => ({ query: PRS_QUERY, variables: { owner, repo, after: cursor } }), (data) => {
        const d = data;
        return { nodes: d.repository.pullRequests.nodes, pageInfo: d.repository.pullRequests.pageInfo };
    })) {
        for (const node of page) {
            const createdMs = new Date(node.createdAt).getTime();
            if (createdMs < sinceMs)
                return prs;
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
//# sourceMappingURL=pull-requests.js.map