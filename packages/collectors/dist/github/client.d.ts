/**
 * GitHub GraphQL API Client
 * Handles authentication, pagination, exponential backoff on rate limits.
 */
export interface GitHubClientConfig {
    token: string;
    /** Max retries on rate-limit (default: 5) */
    maxRetries?: number;
}
export interface PageInfo {
    hasNextPage: boolean;
    endCursor: string | null;
}
export declare class GitHubClient {
    private readonly token;
    private readonly maxRetries;
    constructor(config: GitHubClientConfig);
    query<T>(query: string, variables: Record<string, unknown>): Promise<T>;
    /**
     * Paginate through a GraphQL connection, yielding pages of results.
     * Handles cursor-based pagination transparently.
     */
    paginate<T>(buildQuery: (cursor: string | null) => {
        query: string;
        variables: Record<string, unknown>;
    }, extractPage: (data: unknown) => {
        nodes: T[];
        pageInfo: PageInfo;
    }, batchSize?: number): AsyncGenerator<T[]>;
}
//# sourceMappingURL=client.d.ts.map