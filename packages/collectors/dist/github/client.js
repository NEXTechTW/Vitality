/**
 * GitHub GraphQL API Client
 * Handles authentication, pagination, exponential backoff on rate limits.
 */
const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';
export class GitHubClient {
    token;
    maxRetries;
    constructor(config) {
        this.token = config.token;
        this.maxRetries = config.maxRetries ?? 5;
    }
    async query(query, variables) {
        let attempt = 0;
        while (attempt <= this.maxRetries) {
            const res = await fetch(GITHUB_GRAPHQL_URL, {
                method: 'POST',
                headers: {
                    Authorization: `bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'vitality-health-scanner/1.0',
                },
                body: JSON.stringify({ query, variables }),
            });
            // Handle rate limits with exponential backoff
            if (res.status === 403 || res.status === 429) {
                const retryAfter = res.headers.get('retry-after');
                const waitMs = retryAfter
                    ? parseInt(retryAfter, 10) * 1000
                    : Math.min(1000 * 2 ** attempt, 60_000);
                if (attempt === this.maxRetries) {
                    throw new Error(`GitHub API rate limit exceeded after ${this.maxRetries} retries.`);
                }
                await sleep(waitMs);
                attempt++;
                continue;
            }
            if (!res.ok) {
                throw new Error(`GitHub GraphQL request failed: ${res.status} ${res.statusText}`);
            }
            const json = (await res.json());
            if (json.errors && json.errors.length > 0) {
                throw new Error(`GitHub GraphQL errors: ${JSON.stringify(json.errors)}`);
            }
            if (json.data === undefined) {
                throw new Error('GitHub GraphQL response missing data field.');
            }
            return json.data;
        }
        throw new Error('Unreachable');
    }
    /**
     * Paginate through a GraphQL connection, yielding pages of results.
     * Handles cursor-based pagination transparently.
     */
    async *paginate(buildQuery, extractPage, batchSize = 100) {
        let cursor = null;
        let hasNext = true;
        while (hasNext) {
            const { query, variables } = buildQuery(cursor);
            const data = await this.query(query, { ...variables, first: batchSize, after: cursor });
            const { nodes, pageInfo } = extractPage(data);
            if (nodes.length > 0)
                yield nodes;
            hasNext = pageInfo.hasNextPage;
            cursor = pageInfo.endCursor;
        }
    }
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=client.js.map