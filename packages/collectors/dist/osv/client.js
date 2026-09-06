const OSV_BASE = 'https://api.osv.dev/v1';
function ecosystemToOsv(eco) {
    const map = {
        npm: 'npm',
        pip: 'PyPI',
        cargo: 'crates.io',
        maven: 'Maven',
        go: 'Go',
        nuget: 'NuGet',
        unknown: 'npm',
    };
    return map[eco] ?? 'npm';
}
function parseCvss(vulns) {
    let max = 0;
    for (const v of vulns) {
        for (const s of v.severity ?? []) {
            if (s.type === 'CVSS_V3' || s.type === 'CVSS_V2') {
                const parsed = parseFloat(s.score);
                if (!isNaN(parsed) && parsed > max)
                    max = parsed;
            }
        }
    }
    return max;
}
function cvssToSeverity(score) {
    if (score >= 9)
        return 'CRITICAL';
    if (score >= 7)
        return 'HIGH';
    if (score >= 4)
        return 'MEDIUM';
    return 'LOW';
}
export async function collectVulnerabilities(dependencies) {
    const directDeps = dependencies.filter((d) => d.isDirect);
    const vulnerabilities = [];
    // Batch OSV queries (max 1000 per request per OSV docs)
    const batchSize = 100;
    for (let i = 0; i < directDeps.length; i += batchSize) {
        const batch = directDeps.slice(i, i + batchSize);
        const queries = batch.map((dep) => ({
            package: { name: dep.name, ecosystem: ecosystemToOsv(dep.ecosystem) },
            version: dep.version,
        }));
        const res = await fetch(`${OSV_BASE}/querybatch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ queries }),
        });
        if (!res.ok)
            continue; // Don't fail the whole analysis on OSV errors
        const data = (await res.json());
        for (let j = 0; j < (data.results?.length ?? 0); j++) {
            const result = data.results[j];
            const dep = batch[j];
            if (!result?.vulns?.length || !dep)
                continue;
            const cvss = parseCvss(result.vulns);
            for (const vuln of result.vulns) {
                vulnerabilities.push({
                    id: vuln.id,
                    cvssScore: cvss,
                    severity: cvssToSeverity(cvss),
                    packageName: dep.name,
                    affectedVersions: [],
                    summary: vuln.summary ?? '',
                });
            }
        }
    }
    return vulnerabilities;
}
//# sourceMappingURL=client.js.map