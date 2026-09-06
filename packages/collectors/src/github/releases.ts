/**
 * Releases Collector — fetches release history from GitHub GraphQL API.
 */
import type { GitHubClient } from './client.js';
import type { RawRelease } from '../types.js';

const RELEASES_QUERY = `
  query GetReleases($owner: String!, $repo: String!, $first: Int!, $after: String) {
    repository(owner: $owner, name: $repo) {
      releases(first: $first, after: $after, orderBy: { field: CREATED_AT, direction: DESC }) {
        nodes {
          tagName
          publishedAt
          isPrerelease
          isDraft
          name
          descriptionHTML
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

export async function collectReleases(
  client: GitHubClient,
  owner: string,
  repo: string,
  sinceMs: number,
): Promise<RawRelease[]> {
  const releases: RawRelease[] = [];

  for await (const page of client.paginate(
    (cursor) => ({
      query: RELEASES_QUERY,
      variables: { owner, repo, after: cursor },
    }),
    (data: unknown) => {
      const d = data as { repository: { releases: { nodes: RawRelease[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } } };
      return {
        nodes: d.repository.releases.nodes,
        pageInfo: d.repository.releases.pageInfo,
      };
    },
  )) {
    for (const rel of page) {
      if (!rel.publishedAt) continue;
      const relMs = new Date(rel.publishedAt).getTime();
      // Stop paginating once we've gone past the window
      if (relMs < sinceMs) return releases;
      if (!rel.isDraft) releases.push(rel);
    }
  }

  return releases;
}
