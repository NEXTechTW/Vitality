const FILE_QUERY = `
  query GetFile($owner: String!, $repo: String!, $expression: String!) {
    repository(owner: $owner, name: $repo) {
      object(expression: $expression) {
        ... on Blob { text }
      }
    }
  }
`;
async function fetchFile(client, owner, repo, branch, path) {
    try {
        const data = await client.query(FILE_QUERY, {
            owner,
            repo,
            expression: `${branch}:${path}`,
        });
        return data.repository.object?.text ?? null;
    }
    catch {
        return null;
    }
}
function parseNpm(content) {
    try {
        const pkg = JSON.parse(content);
        const deps = [];
        for (const [name, version] of Object.entries(pkg.dependencies ?? {})) {
            deps.push({ name, version: version.replace(/^[\^~>=<]/, ''), ecosystem: 'npm', isDirect: true });
        }
        return deps;
    }
    catch {
        return [];
    }
}
function parsePip(content) {
    const deps = [];
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#'))
            continue;
        const match = trimmed.match(/^([A-Za-z0-9_.-]+)[>=<!\s]*([\d.]*)/);
        if (!match)
            continue;
        deps.push({
            name: match[1] ?? trimmed,
            version: match[2] || '0',
            ecosystem: 'pip',
            isDirect: true,
        });
    }
    return deps;
}
export async function collectDependencies(client, owner, repo, branch) {
    const results = await Promise.all([
        fetchFile(client, owner, repo, branch, 'package.json').then((c) => (c ? parseNpm(c) : [])),
        fetchFile(client, owner, repo, branch, 'requirements.txt').then((c) => (c ? parsePip(c) : [])),
        // Cargo.toml and go.mod can be added similarly
    ]);
    return results.flat();
}
//# sourceMappingURL=dependencies.js.map