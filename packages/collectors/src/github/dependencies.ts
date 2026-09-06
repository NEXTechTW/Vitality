/**
 * Dependency Collector
 * Reads package manifests from the repository via GitHub API (no code execution).
 */
import type { GitHubClient } from './client.js';
import type { RawDependency } from '../types.js';

const FILE_QUERY = `
  query GetFile($owner: String!, $repo: String!, $expression: String!) {
    repository(owner: $owner, name: $repo) {
      object(expression: $expression) {
        ... on Blob { text }
      }
    }
  }
`;

interface FileQueryResult {
  repository: { object: { text: string } | null };
}

async function fetchFile(
  client: GitHubClient,
  owner: string,
  repo: string,
  branch: string,
  path: string,
): Promise<string | null> {
  try {
    const data = await client.query<FileQueryResult>(FILE_QUERY, {
      owner,
      repo,
      expression: `${branch}:${path}`,
    });
    return data.repository.object?.text ?? null;
  } catch {
    return null;
  }
}

function parseNpm(content: string): RawDependency[] {
  try {
    const pkg = JSON.parse(content) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps: RawDependency[] = [];
    for (const [name, version] of Object.entries(pkg.dependencies ?? {})) {
      deps.push({ name, version: version.replace(/^[\^~>=<]/, ''), ecosystem: 'npm', isDirect: true });
    }
    return deps;
  } catch {
    return [];
  }
}

function parsePip(content: string): RawDependency[] {
  const deps: RawDependency[] = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z0-9_.-]+)[>=<!\s]*([\d.]*)/);
    if (!match) continue;
    deps.push({
      name: match[1] ?? trimmed,
      version: match[2] || '0',
      ecosystem: 'pip',
      isDirect: true,
    });
  }
  return deps;
}

export async function collectDependencies(
  client: GitHubClient,
  owner: string,
  repo: string,
  branch: string,
): Promise<RawDependency[]> {
  const results = await Promise.all([
    fetchFile(client, owner, repo, branch, 'package.json').then((c) => (c ? parseNpm(c) : [])),
    fetchFile(client, owner, repo, branch, 'requirements.txt').then((c) => (c ? parsePip(c) : [])),
    // Cargo.toml and go.mod can be added similarly
  ]);

  return results.flat();
}
