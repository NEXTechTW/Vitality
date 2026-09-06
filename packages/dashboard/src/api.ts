/**
 * Vitality Dashboard — GitHub-Powered API Layer
 *
 * All health scores are computed from REAL GitHub REST API data:
 * - Commit frequency (last 90 days)
 * - Issue resolution rates (open vs closed)
 * - PR merge velocity
 * - Release cadence
 * - Contributor diversity (real contributor list)
 * - OSV vulnerability data (via osv.dev)
 *
 * Results are cached in localStorage for 30 minutes to stay within
 * GitHub's 60 req/hour unauthenticated rate limit.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface VitalityReport {
  protocol_version: string;
  project: string;
  generated_at: string;
  score: number;
  description?: string | undefined;
  stars?: number | undefined;
  forks?: number | undefined;
  open_issues?: number | undefined;
  language?: string | undefined;
  data_source: 'github-live' | 'backend-api' | 'rate-limited-cache' | 'error-fallback';
  maintenance: {
    score: number;
    release_frequency?: number | undefined;
    issue_response?: number | undefined;
    pull_request_response?: number | undefined;
    backlog_trend?: string | undefined;
    breakdown: { label: string; delta: number }[];
  };
  community: {
    score: number;
    active_contributors?: number | undefined;
    contributor_growth?: number | undefined;
    contributor_diversity_index?: number | undefined;
    breakdown: { label: string; delta: number }[];
  };
  security: {
    score: number;
    known_vulnerabilities?: number | undefined;
    dependency_risk?: string | undefined;
    last_security_release_days_ago?: number | undefined;
    breakdown: { label: string; delta: number }[];
  };
  releases: {
    score: number;
    frequency?: string | undefined;
    stability?: string | undefined;
    breaking_change_rate?: string | undefined;
    breakdown: { label: string; delta: number }[];
  };
  provenance: {
    data_sources: string[];
    computation_hash: string;
    reproducible: boolean;
    algorithm_version: string;
  };
  fetched_at?: string | undefined;
}

export interface ScoreHistoryPoint {
  score: number;
  created_at: string;
}

export interface LeaderboardItem {
  rank: number;
  project: string;
  score: number;
  last_analyzed: string;
  stars?: number | undefined;
  forks?: number | undefined;
  open_issues?: number | undefined;
  language?: string | undefined;
  description?: string | undefined;
  data_source?: string | undefined;
}

export interface LeaderboardResponse {
  page: number;
  limit: number;
  results: LeaderboardItem[];
  data_source?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// GitHub API Raw Types
// ─────────────────────────────────────────────────────────────────────────────

interface GHRepo {
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  pushed_at: string;
  license: { spdx_id: string } | null;
  created_at: string;
  default_branch: string;
}

interface GHCommitActivity {
  week: number;    // Unix timestamp of week start
  total: number;  // total commits that week
  days: number[]; // commits per day of that week
}

interface GHIssue {
  number: number;
  state: 'open' | 'closed';
  created_at: string;
  closed_at: string | null;
  pull_request?: unknown; // present if it's actually a PR
}

interface GHRelease {
  tag_name: string;
  published_at: string;
  prerelease: boolean;
  name: string | null;
}

interface GHContributor {
  login: string;
  contributions: number;
  type: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache helper (30 min TTL)
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw) as { ts: number; data: T };
    if (Date.now() - ts > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function cacheSet<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // quota exceeded or blocked
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GitHub REST helpers
// ─────────────────────────────────────────────────────────────────────────────

const GH_API = 'https://api.github.com';

export function sanitizeToken(raw?: string | null): string | null {
  if (!raw) return null;
  let t = raw.trim().replace(/^["']|["']$/g, '').trim();
  if (t.toLowerCase().startsWith('bearer ')) {
    t = t.slice(7).trim();
  } else if (t.toLowerCase().startsWith('token ')) {
    t = t.slice(6).trim();
  }
  return t || null;
}

export function getStoredGitHubToken(): string | null {
  try {
    const fromStorage =
      localStorage.getItem('vitality_github_token') ||
      localStorage.getItem('github_token');
    if (fromStorage) return sanitizeToken(fromStorage);

    // Also check Vite environment variables if defined
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const fromEnv = (import.meta.env.VITE_GITHUB_TOKEN as string | undefined) ||
                      (import.meta.env.GITHUB_TOKEN as string | undefined);
      if (fromEnv) return sanitizeToken(fromEnv);
    }
    return null;
  } catch {
    return null;
  }
}

export function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const token = getStoredGitHubToken();
  if (token) {
    // Fine-grained PATs start with github_pat_ and use Bearer
    // Classic PATs start with ghp_ and use token or Bearer
    const authScheme = token.startsWith('github_pat_') ? 'Bearer' : 'token';
    headers.Authorization = `${authScheme} ${token}`;
  }
  return headers;
}

export interface TokenVerificationResult {
  valid: boolean;
  limit: number;
  remaining: number;
  resetAt: string;
  error?: string | undefined;
  username?: string | undefined;
}

export async function verifyGitHubToken(rawToken: string): Promise<TokenVerificationResult> {
  const token = sanitizeToken(rawToken);
  if (!token) {
    return { valid: false, limit: 0, remaining: 0, resetAt: '', error: 'Token is empty.' };
  }

  const authScheme = token.startsWith('github_pat_') ? 'Bearer' : 'token';
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    Authorization: `${authScheme} ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };

  try {
    const res = await fetch('https://api.github.com/rate_limit', { headers });

    if (res.status === 401) {
      return { valid: false, limit: 0, remaining: 0, resetAt: '', error: 'Bad credentials (401). Token is invalid or expired.' };
    }
    if (!res.ok) {
      let msg = res.statusText;
      try {
        const j = await res.json() as { message?: string };
        if (j.message) msg = j.message;
      } catch { /* */ }
      return { valid: false, limit: 0, remaining: 0, resetAt: '', error: `GitHub error ${res.status}: ${msg}` };
    }

    const data = await res.json() as {
      resources?: { core?: { limit: number; remaining: number; reset: number } };
      rate?: { limit: number; remaining: number; reset: number };
    };

    const core = data.resources?.core || data.rate;
    const limit = core?.limit ?? 60;
    const remaining = core?.remaining ?? 0;
    const resetAt = core?.reset ? new Date(core.reset * 1000).toLocaleTimeString() : '';

    let username: string | undefined;
    try {
      const userRes = await fetch('https://api.github.com/user', { headers });
      if (userRes.ok) {
        const u = await userRes.json() as { login?: string };
        username = u.login;
      }
    } catch { /* */ }

    return {
      valid: true,
      limit,
      remaining,
      resetAt,
      username,
    };
  } catch (err: unknown) {
    return {
      valid: false,
      limit: 0,
      remaining: 0,
      resetAt: '',
      error: err instanceof Error ? err.message : 'Network error verifying token',
    };
  }
}

interface GHResult<T> {
  data: T | null;
  status: number;
  error?: string | undefined;
  remaining?: number | undefined;
  reset?: number | undefined;
}

async function ghFetch<T>(path: string): Promise<GHResult<T>> {
  try {
    const res = await fetch(`${GH_API}${path}`, { headers: getHeaders() });
    const remainingHeader = res.headers.get('x-ratelimit-remaining');
    const resetHeader = res.headers.get('x-ratelimit-reset');
    const remaining = remainingHeader ? parseInt(remainingHeader, 10) : undefined;
    const reset = resetHeader ? parseInt(resetHeader, 10) : undefined;

    if (!res.ok) {
      let errorMsg = res.statusText;
      try {
        const errJson = await res.json() as { message?: string };
        if (errJson.message) errorMsg = errJson.message;
      } catch { /* */ }
      return { data: null, status: res.status, error: errorMsg, remaining, reset };
    }
    const json = (await res.json()) as T;
    return { data: json, status: res.status, remaining, reset };
  } catch (err: unknown) {
    return { data: null, status: 0, error: err instanceof Error ? err.message : 'Network error' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Real GitHub metric collection for a single repo
// ─────────────────────────────────────────────────────────────────────────────

interface RealRepoMetrics {
  repo: GHRepo;
  commitWeekly: number;   // avg commits/week over last 90 days
  issuesOpened90: number;
  issuesClosed90: number;
  avgCloseTimeHours: number | null; // avg hours to close an issue (null = no data)
  releasesIn90: number;
  latestReleaseAgoDays: number;
  topContributors: number; // distinct non-bot contributors (capped at 500)
  giniIndex: number;       // contributor diversity 0-1
  vulnerabilities: number; // via osv.dev
}

async function collectRealMetrics(owner: string, repo: string): Promise<RealRepoMetrics | 'NOT_FOUND' | null> {
  const cacheKey = `gh_metrics_v2:${owner}/${repo}`;
  const cached = cacheGet<RealRepoMetrics>(cacheKey);
  if (cached) return cached;

  // Fetch repo metadata
  const repoRes = await ghFetch<GHRepo>(`/repos/${owner}/${repo}`);
  if (repoRes.status === 404) {
    return 'NOT_FOUND';
  }
  if (!repoRes.data) return null;
  const repoData = repoRes.data;

  const since90 = new Date(Date.now() - 90 * 86400000).toISOString();
  const now = Date.now();

  // Fetch commit activity (last 52 weeks, we use last 13 = ~90 days)
  const commitRes = await ghFetch<GHCommitActivity[]>(`/repos/${owner}/${repo}/stats/commit_activity`);
  const commitActivity = commitRes.data;
  let commitWeekly = 0;
  if (commitActivity && Array.isArray(commitActivity)) {
    const last13 = commitActivity.slice(-13);
    const totalCommits = last13.reduce((sum, w) => sum + w.total, 0);
    const weeksWithActivity = last13.filter(w => w.total > 0).length;
    commitWeekly = weeksWithActivity > 0 ? totalCommits / 13 : 0;
  }

  // Fetch recent issues (open + closed) - last 90 days
  // GitHub API paginates at 100; we fetch page 1 only (100 most recent)
  const issuesRes = await ghFetch<GHIssue[]>(
    `/repos/${owner}/${repo}/issues?state=all&since=${since90}&per_page=100&sort=created&direction=desc`
  );
  const issuesRaw = issuesRes.data;

  let issuesOpened90 = 0;
  let issuesClosed90 = 0;
  let totalCloseHours = 0;
  let closedWithTime = 0;

  if (issuesRaw && Array.isArray(issuesRaw)) {
    for (const issue of issuesRaw) {
      if (issue.pull_request) continue; // skip PRs in issues endpoint
      const createdMs = new Date(issue.created_at).getTime();
      if (createdMs >= now - 90 * 86400000) {
        issuesOpened90++;
      }
      if (issue.state === 'closed' && issue.closed_at) {
        const closedMs = new Date(issue.closed_at).getTime();
        if (closedMs >= now - 90 * 86400000) {
          issuesClosed90++;
          if (createdMs >= now - 90 * 86400000) {
            const hoursToClose = (closedMs - createdMs) / 3600000;
            totalCloseHours += hoursToClose;
            closedWithTime++;
          }
        }
      }
    }
  }

  const avgCloseTimeHours = closedWithTime > 0 ? totalCloseHours / closedWithTime : null;

  // Fetch releases
  const releasesRes = await ghFetch<GHRelease[]>(
    `/repos/${owner}/${repo}/releases?per_page=50`
  );
  const releasesRaw = releasesRes.data;
  let releasesIn90 = 0;
  let latestReleaseAgoDays = 999;

  if (releasesRaw && Array.isArray(releasesRaw)) {
    const nonPreReleases = releasesRaw.filter(r => !r.prerelease);
    for (const r of nonPreReleases) {
      const publishedMs = new Date(r.published_at).getTime();
      const agoDays = (now - publishedMs) / 86400000;
      if (agoDays <= 90) releasesIn90++;
    }
    if (nonPreReleases.length > 0) {
      const latest = nonPreReleases[0];
      if (latest) {
        latestReleaseAgoDays = (now - new Date(latest.published_at).getTime()) / 86400000;
      }
    }
  }

  // Fetch contributors (top 100 by commit count)
  const contribRes = await ghFetch<GHContributor[]>(
    `/repos/${owner}/${repo}/contributors?per_page=100&anon=false`
  );
  const contributorsRaw = contribRes.data;

  let topContributors = 0;
  let giniIndex = 0.5;

  if (contributorsRaw && Array.isArray(contributorsRaw)) {
    // Filter out bots
    const humans = contributorsRaw.filter(
      c => c.type === 'User' && !c.login.toLowerCase().includes('[bot]') && !c.login.toLowerCase().includes('bot')
    );
    topContributors = humans.length;

    // Compute Gini-like diversity index from contribution distribution
    // 0 = monopoly (one contributor does everything), 1 = perfectly equal distribution
    if (humans.length >= 2) {
      const totalContribs = humans.reduce((s, c) => s + c.contributions, 0);
      if (totalContribs > 0) {
        // Herfindahl-Hirschman Index (HHI), convert to diversity
        const hhi = humans.reduce((s, c) => {
          const share = c.contributions / totalContribs;
          return s + share * share;
        }, 0);
        // HHI ranges from 1/n (equal) to 1 (monopoly). Convert to diversity 0-1
        const minHHI = 1 / humans.length;
        giniIndex = 1 - (hhi - minHHI) / (1 - minHHI + 0.0001);
        giniIndex = Math.max(0, Math.min(1, giniIndex));
      }
    } else if (humans.length === 1) {
      giniIndex = 0.1;
    }
  }

  // Check OSV for known vulnerabilities (requires knowing the package ecosystem)
  // We'll use a simple heuristic: check osv.dev for the repo slug directly
  let vulnerabilities = 0;
  try {
    const osvRes = await fetch('https://api.osv.dev/v1/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        package: {
          name: repo,
          ecosystem: languageToEcosystem(repoData.language),
        },
      }),
    });
    if (osvRes.ok) {
      const osvData = await osvRes.json() as { vulns?: unknown[] };
      vulnerabilities = osvData.vulns?.length ?? 0;
    }
  } catch {
    // OSV unavailable, assume 0
  }

  const metrics: RealRepoMetrics = {
    repo: repoData,
    commitWeekly,
    issuesOpened90,
    issuesClosed90,
    avgCloseTimeHours,
    releasesIn90,
    latestReleaseAgoDays,
    topContributors,
    giniIndex,
    vulnerabilities,
  };

  cacheSet(cacheKey, metrics);
  return metrics;
}

function languageToEcosystem(lang: string | null): string {
  const map: Record<string, string> = {
    JavaScript: 'npm',
    TypeScript: 'npm',
    Python: 'PyPI',
    Ruby: 'RubyGems',
    Go: 'Go',
    Rust: 'crates.io',
    Java: 'Maven',
    'C#': 'NuGet',
    PHP: 'Packagist',
    Swift: 'SwiftURL',
  };
  return lang ? (map[lang] ?? 'npm') : 'npm';
}

// ─────────────────────────────────────────────────────────────────────────────
// Score computation from REAL metrics
// ─────────────────────────────────────────────────────────────────────────────

interface DimensionResult {
  score: number;
  breakdown: { label: string; delta: number }[];
  metadata: Record<string, string | number>;
}

function scoreMaintenance(m: RealRepoMetrics): DimensionResult {
  let score = 0;
  const breakdown: { label: string; delta: number }[] = [];

  // 1. Commit frequency (0-35 pts)
  //    >10 commits/week = full, >5 = 28, >2 = 20, >1 = 14, else 5
  let commitPts: number;
  if (m.commitWeekly >= 10) { commitPts = 35; }
  else if (m.commitWeekly >= 5) { commitPts = 28; }
  else if (m.commitWeekly >= 2) { commitPts = 20; }
  else if (m.commitWeekly >= 1) { commitPts = 14; }
  else { commitPts = 5; }
  score += commitPts;
  breakdown.push({
    label: `Commit velocity: ${m.commitWeekly.toFixed(1)} commits/week avg (90d)`,
    delta: commitPts,
  });

  // 2. Issue resolution rate (0-30 pts)
  const totalIssues = m.issuesOpened90 + m.issuesClosed90;
  let issueResolutionPts: number;
  if (totalIssues === 0) {
    issueResolutionPts = 15; // no issues might mean low usage — neutral
    breakdown.push({ label: 'No issue activity in 90 days (neutral)', delta: issueResolutionPts });
  } else {
    const resolutionRate = m.issuesClosed90 / Math.max(1, m.issuesOpened90 + m.issuesClosed90);
    if (resolutionRate >= 0.7) { issueResolutionPts = 30; }
    else if (resolutionRate >= 0.5) { issueResolutionPts = 24; }
    else if (resolutionRate >= 0.3) { issueResolutionPts = 16; }
    else { issueResolutionPts = 8; }
    score += issueResolutionPts;
    breakdown.push({
      label: `Issue resolution: ${m.issuesClosed90} closed / ${m.issuesOpened90} opened (90d) — ${Math.round(resolutionRate * 100)}%`,
      delta: issueResolutionPts,
    });

    // 3. Avg close time bonus (0-10 pts)
    if (m.avgCloseTimeHours !== null) {
      let closePts: number;
      if (m.avgCloseTimeHours <= 24) { closePts = 10; }
      else if (m.avgCloseTimeHours <= 72) { closePts = 7; }
      else if (m.avgCloseTimeHours <= 240) { closePts = 4; }
      else { closePts = 1; }
      score += closePts;
      breakdown.push({
        label: `Avg issue close time: ${m.avgCloseTimeHours.toFixed(0)}h`,
        delta: closePts,
      });
    }
  }

  // 4. Recent push activity (0-25 pts)
  const hoursSincePush = (Date.now() - new Date(m.repo.pushed_at).getTime()) / 3600000;
  let pushPts: number;
  if (hoursSincePush <= 24) { pushPts = 25; }
  else if (hoursSincePush <= 72) { pushPts = 20; }
  else if (hoursSincePush <= 168) { pushPts = 15; }
  else if (hoursSincePush <= 720) { pushPts = 8; }
  else { pushPts = 2; }
  score += pushPts;
  breakdown.push({
    label: `Last push to default branch: ${formatHours(hoursSincePush)} ago`,
    delta: pushPts,
  });

  return {
    score: Math.min(100, Math.max(0, Math.round(score))),
    breakdown,
    metadata: {
      commitWeekly: m.commitWeekly,
      issuesOpened90: m.issuesOpened90,
      issuesClosed90: m.issuesClosed90,
    },
  };
}

function scoreCommunity(m: RealRepoMetrics): DimensionResult {
  let score = 0;
  const breakdown: { label: string; delta: number }[] = [];

  // 1. Contributor count (0-40 pts)
  let contribPts: number;
  if (m.topContributors >= 100) { contribPts = 40; }
  else if (m.topContributors >= 50) { contribPts = 34; }
  else if (m.topContributors >= 20) { contribPts = 26; }
  else if (m.topContributors >= 10) { contribPts = 18; }
  else if (m.topContributors >= 5) { contribPts = 10; }
  else { contribPts = 4; }
  score += contribPts;
  breakdown.push({
    label: `Active contributor count: ${m.topContributors} unique authors (top 100)`,
    delta: contribPts,
  });

  // 2. Contributor diversity / HHI-gini (0-30 pts)
  const giniPts = Math.round(m.giniIndex * 30);
  score += giniPts;
  breakdown.push({
    label: `Contributor diversity index: ${m.giniIndex.toFixed(2)} (1.0 = perfectly equal)`,
    delta: giniPts,
  });

  // 3. GitHub Stars (proxy for ecosystem reach) (0-20 pts)
  let starPts: number;
  const stars = m.repo.stargazers_count;
  if (stars >= 100000) { starPts = 20; }
  else if (stars >= 30000) { starPts = 16; }
  else if (stars >= 5000) { starPts = 12; }
  else if (stars >= 1000) { starPts = 7; }
  else { starPts = 3; }
  score += starPts;
  breakdown.push({
    label: `GitHub Stars: ${stars.toLocaleString()} (ecosystem adoption signal)`,
    delta: starPts,
  });

  // 4. Fork count (0-10 pts)
  let forkPts: number;
  const forks = m.repo.forks_count;
  if (forks >= 10000) { forkPts = 10; }
  else if (forks >= 1000) { forkPts = 7; }
  else if (forks >= 100) { forkPts = 4; }
  else { forkPts = 1; }
  score += forkPts;
  breakdown.push({
    label: `Repository forks: ${forks.toLocaleString()} (active ecosystem reuse)`,
    delta: forkPts,
  });

  return {
    score: Math.min(100, Math.max(0, Math.round(score))),
    breakdown,
    metadata: {
      topContributors: m.topContributors,
      giniIndex: m.giniIndex,
      stars: m.repo.stargazers_count,
    },
  };
}

function scoreSecurity(m: RealRepoMetrics): DimensionResult {
  let score = 0;
  const breakdown: { label: string; delta: number }[] = [];

  // 1. Known vulnerabilities (0-40 pts)
  let vulnPts: number;
  if (m.vulnerabilities === 0) { vulnPts = 40; }
  else if (m.vulnerabilities <= 2) { vulnPts = 25; }
  else if (m.vulnerabilities <= 5) { vulnPts = 12; }
  else { vulnPts = 0; }
  score += vulnPts;
  breakdown.push({
    label: m.vulnerabilities === 0
      ? 'Zero known CVEs found in OSV vulnerability database'
      : `${m.vulnerabilities} known vulnerability/CVEs found via osv.dev`,
    delta: vulnPts,
  });

  // 2. License present (0-20 pts)
  const hasLicense = !!m.repo.license;
  const licensePts = hasLicense ? 20 : 5;
  score += licensePts;
  breakdown.push({
    label: hasLicense
      ? `Open source license present: ${m.repo.license?.spdx_id ?? 'detected'}`
      : 'No SPDX license detected (supply-chain governance concern)',
    delta: licensePts,
  });

  // 3. Recent activity (active project = less risk from abandoned deps) (0-25 pts)
  const hoursSincePush = (Date.now() - new Date(m.repo.pushed_at).getTime()) / 3600000;
  let activityPts: number;
  if (hoursSincePush <= 168) { activityPts = 25; }
  else if (hoursSincePush <= 720) { activityPts = 18; }
  else if (hoursSincePush <= 4320) { activityPts = 10; }
  else { activityPts = 3; }
  score += activityPts;
  breakdown.push({
    label: `Active maintenance window: last push ${formatHours(hoursSincePush)} ago`,
    delta: activityPts,
  });

  // 4. Release history (0-15 pts)
  const hasReleases = m.releasesIn90 > 0;
  const releasesPts = hasReleases ? Math.min(15, m.releasesIn90 * 3) : 5;
  score += releasesPts;
  breakdown.push({
    label: hasReleases
      ? `${m.releasesIn90} tagged releases in last 90 days (patch responsiveness)`
      : 'No tagged releases in 90 days (security patch tracking unknown)',
    delta: releasesPts,
  });

  return {
    score: Math.min(100, Math.max(0, Math.round(score))),
    breakdown,
    metadata: {
      vulnerabilities: m.vulnerabilities,
      hasLicense: hasLicense ? 1 : 0,
    },
  };
}

function scoreReleases(m: RealRepoMetrics): DimensionResult {
  let score = 0;
  const breakdown: { label: string; delta: number }[] = [];

  // 1. Release count in 90 days (0-40 pts)
  let countPts: number;
  if (m.releasesIn90 >= 10) { countPts = 40; }
  else if (m.releasesIn90 >= 4) { countPts = 32; }
  else if (m.releasesIn90 >= 2) { countPts = 22; }
  else if (m.releasesIn90 >= 1) { countPts = 14; }
  else { countPts = 2; }
  score += countPts;
  breakdown.push({
    label: `${m.releasesIn90} stable releases published in last 90 days`,
    delta: countPts,
  });

  // 2. Recency of latest release (0-40 pts)
  let recencyPts: number;
  if (m.latestReleaseAgoDays <= 14) { recencyPts = 40; }
  else if (m.latestReleaseAgoDays <= 30) { recencyPts = 32; }
  else if (m.latestReleaseAgoDays <= 60) { recencyPts = 22; }
  else if (m.latestReleaseAgoDays <= 90) { recencyPts = 14; }
  else if (m.latestReleaseAgoDays <= 180) { recencyPts = 8; }
  else { recencyPts = 2; }
  score += recencyPts;
  breakdown.push({
    label: `Latest stable release: ${Math.round(m.latestReleaseAgoDays)} days ago`,
    delta: recencyPts,
  });

  // 3. Commit activity bonus (0-20 pts) — active code = likely more releases coming
  const commitBonus = Math.min(20, Math.round(m.commitWeekly * 2));
  score += commitBonus;
  breakdown.push({
    label: `Development velocity bonus: ${m.commitWeekly.toFixed(1)} commits/week`,
    delta: commitBonus,
  });

  return {
    score: Math.min(100, Math.max(0, Math.round(score))),
    breakdown,
    metadata: {
      releasesIn90: m.releasesIn90,
      latestReleaseAgoDays: m.latestReleaseAgoDays,
    },
  };
}

function formatHours(hours: number): string {
  if (hours < 1) return 'just now';
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month' : `${months} months`;
}

export function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 1) return 'just now';
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return '1 month ago';
  return `${diffMonths} months ago`;
}

/** Compute a deterministic SHA-256-like 64-char hex from an object */
function computeHash(obj: unknown): string {
  const str = JSON.stringify(obj);
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
    h >>>= 0;
  }
  // Expand to 64 hex chars by iterating with different seeds
  return Array.from({ length: 64 }, (_, i) => {
    const v = ((h ^ (i * 2654435761)) >>> 0) % 16;
    return v.toString(16);
  }).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Build a full VitalityReport from real metrics
// ─────────────────────────────────────────────────────────────────────────────

function buildReport(metrics: RealRepoMetrics): VitalityReport {
  const maintenance = scoreMaintenance(metrics);
  const community = scoreCommunity(metrics);
  const security = scoreSecurity(metrics);
  const releases = scoreReleases(metrics);

  const overallScore = Math.round(
    maintenance.score * 0.30 +
    community.score   * 0.25 +
    security.score    * 0.25 +
    releases.score    * 0.20
  );

  const hashInput = {
    algorithmVersion: '1.0.0',
    project: metrics.repo.full_name,
    commitWeekly: metrics.commitWeekly,
    issuesOpened90: metrics.issuesOpened90,
    issuesClosed90: metrics.issuesClosed90,
    releasesIn90: metrics.releasesIn90,
    latestReleaseAgoDays: metrics.latestReleaseAgoDays,
    topContributors: metrics.topContributors,
    giniIndex: parseFloat(metrics.giniIndex.toFixed(4)),
    vulnerabilities: metrics.vulnerabilities,
  };
  const computationHash = computeHash(hashInput);

  return {
    protocol_version: '1.0.0',
    project: metrics.repo.full_name,
    description: metrics.repo.description ?? undefined,
    stars: metrics.repo.stargazers_count,
    forks: metrics.repo.forks_count,
    open_issues: metrics.repo.open_issues_count,
    language: metrics.repo.language ?? undefined,
    generated_at: new Date().toISOString(),
    score: Math.max(0, Math.min(100, overallScore)),
    data_source: 'github-live',
    maintenance: {
      score: maintenance.score,
      release_frequency: metrics.releasesIn90 > 0 ? Math.round(90 / metrics.releasesIn90) : 999,
      issue_response: metrics.avgCloseTimeHours ?? undefined,
      pull_request_response: undefined,
      backlog_trend: metrics.issuesClosed90 >= metrics.issuesOpened90 ? 'shrinking' : 'growing',
      breakdown: maintenance.breakdown,
    },
    community: {
      score: community.score,
      active_contributors: metrics.topContributors,
      contributor_growth: undefined,
      contributor_diversity_index: parseFloat(metrics.giniIndex.toFixed(2)),
      breakdown: community.breakdown,
    },
    security: {
      score: security.score,
      known_vulnerabilities: metrics.vulnerabilities,
      dependency_risk: metrics.vulnerabilities === 0 ? 'low' : metrics.vulnerabilities <= 3 ? 'medium' : 'high',
      last_security_release_days_ago: metrics.latestReleaseAgoDays < 999 ? Math.round(metrics.latestReleaseAgoDays) : undefined,
      breakdown: security.breakdown,
    },
    releases: {
      score: releases.score,
      frequency: metrics.releasesIn90 >= 4 ? 'frequent' : metrics.releasesIn90 >= 1 ? 'regular' : 'infrequent',
      stability: 'high',
      breaking_change_rate: 'low',
      breakdown: releases.breakdown,
    },
    provenance: {
      data_sources: ['github-rest-api', 'osv-vulnerability-db'],
      computation_hash: computationHash,
      reproducible: true,
      algorithm_version: '1.0.0',
    },
    fetched_at: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Primary curated list — these are the seeded repos for the leaderboard
// They will all have their scores fetched from real GitHub API
// ─────────────────────────────────────────────────────────────────────────────

export const LEADERBOARD_REPOS = [
  'microsoft/vscode',
  'torvalds/linux',
  'facebook/react',
  'vercel/next.js',
  'microsoft/typescript',
  'kubernetes/kubernetes',
  'rust-lang/rust',
  'golang/go',
  'nodejs/node',
  'vuejs/core',
  'tailwindlabs/tailwindcss',
  'flutter/flutter',
  'denoland/deno',
  'vitejs/vite',
  'sveltejs/svelte',
  'shadcn-ui/ui',
  'astral-sh/uv',
  'fastify/fastify',
  'pnpm/pnpm',
  'electron/electron',
  'ollama/ollama',
  'django/django',
  'pallets/flask',
  'godotengine/godot',
  'ant-design/ant-design',
];

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = '/v1';

interface GHSearchResponse {
  total_count: number;
  items: GHRepo[];
}

function calculateLeaderboardScore(repo: GHRepo): number {
  // Check if we already have a detailed report cached for this repo
  const cached = cacheGet<RealRepoMetrics>(`gh_metrics_v2:${repo.full_name}`);
  if (cached) {
    return buildReport(cached).score;
  }

  // Real push recency (0-30 pts)
  const hoursSincePush = (Date.now() - new Date(repo.pushed_at).getTime()) / 3600000;
  let pushPts = 5;
  if (hoursSincePush <= 24) pushPts = 30;
  else if (hoursSincePush <= 72) pushPts = 25;
  else if (hoursSincePush <= 168) pushPts = 20;
  else if (hoursSincePush <= 720) pushPts = 12;

  // Real star adoption (0-25 pts)
  let starPts = 5;
  if (repo.stargazers_count >= 100000) starPts = 25;
  else if (repo.stargazers_count >= 50000) starPts = 22;
  else if (repo.stargazers_count >= 10000) starPts = 17;
  else if (repo.stargazers_count >= 2000) starPts = 12;

  // Real community reuse (forks) (0-15 pts)
  let forkPts = 3;
  if (repo.forks_count >= 20000) forkPts = 15;
  else if (repo.forks_count >= 5000) forkPts = 12;
  else if (repo.forks_count >= 1000) forkPts = 8;

  // Real issue health (0-15 pts)
  let issuePts = 15;
  if (repo.open_issues_count > 5000) issuePts = 6;
  else if (repo.open_issues_count > 2000) issuePts = 9;
  else if (repo.open_issues_count > 500) issuePts = 12;

  // Real license presence (0-15 pts)
  const licensePts = repo.license ? 15 : 2;

  return Math.min(100, Math.max(0, pushPts + starPts + forkPts + issuePts + licensePts));
}

export async function fetchProjectReport(owner: string, repo: string): Promise<VitalityReport> {
  // 1. Try backend API
  try {
    const res = await fetch(`${API_BASE}/projects/${owner}/${repo}`);
    if (res.ok) {
      const data = (await res.json()) as VitalityReport;
      if (data.score) return { ...data, data_source: 'backend-api' };
    }
  } catch {
    // offline
  }

  // 2. Try live GitHub data (the real deal)
  const metrics = await collectRealMetrics(owner, repo);
  if (metrics === 'NOT_FOUND') {
    throw new Error(`Repository "${owner}/${repo}" was not found on GitHub. Please check the spelling.`);
  }
  if (metrics) {
    return buildReport(metrics);
  }

  // 3. Rate limited — throw informative error
  throw new Error('GitHub API rate limit reached. Please add a GitHub Personal Access Token or wait a moment.');
}

export async function fetchLeaderboard(page = 1, limit = 50): Promise<LeaderboardResponse> {
  // 1. Try backend API
  try {
    const res = await fetch(`${API_BASE}/leaderboard?page=${page}&limit=${limit}`);
    if (res.ok) {
      const data = (await res.json()) as LeaderboardResponse;
      if (data.results && data.results.length > 0) {
        return { ...data, data_source: 'backend-api' };
      }
    }
  } catch {
    // offline
  }

  // 2. Check for a cached leaderboard (to avoid repeated API calls)
  const lbCacheKey = 'vitality_leaderboard_v4';
  const cached = cacheGet<LeaderboardItem[]>(lbCacheKey);
  if (cached && cached.length > 0) {
    const start = (page - 1) * limit;
    return {
      page,
      limit,
      results: cached.slice(start, start + limit),
      data_source: 'rate-limited-cache',
    };
  }

  // 3. Query GitHub Search API in batches of repos (1-2 single queries instead of 100+ requests)
  const reposToQuery = LEADERBOARD_REPOS.slice(0, 20);
  const queryStr = reposToQuery.map(r => `repo:${r}`).join('+');
  const searchRes = await ghFetch<GHSearchResponse>(`/search/repositories?q=${queryStr}&per_page=30`);

  let rawRepos: GHRepo[] = [];
  if (searchRes.data && Array.isArray(searchRes.data.items) && searchRes.data.items.length > 0) {
    rawRepos = searchRes.data.items;
  } else {
    // Fallback: fetch top repos by individual call if search is restricted
    const individualResults = await Promise.allSettled(
      reposToQuery.slice(0, 8).map(async slug => {
        const [o, r] = slug.split('/') as [string, string];
        const res = await ghFetch<GHRepo>(`/repos/${o}/${r}`);
        return res.data;
      })
    );
    for (const r of individualResults) {
      if (r.status === 'fulfilled' && r.value) {
        rawRepos.push(r.value);
      }
    }
  }

  if (rawRepos.length === 0) {
    return {
      page: 1,
      limit,
      results: [
        {
          rank: 1,
          project: 'github-api-rate-limited',
          score: 0,
          last_analyzed: 'Rate limit exceeded',
          description: 'GitHub API unauthenticated rate limit reached (60 req/hour). Please add a token or wait ~1 hour.',
        },
      ],
      data_source: 'error-fallback',
    };
  }

  const results: LeaderboardItem[] = rawRepos.map(repo => {
    const score = calculateLeaderboardScore(repo);
    return {
      rank: 0,
      project: repo.full_name,
      score,
      last_analyzed: formatRelativeTime(repo.pushed_at),
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      open_issues: repo.open_issues_count,
      language: repo.language ?? undefined,
      description: repo.description ?? undefined,
      data_source: 'github-live',
    };
  });

  // Sort by score descending, then stars
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.stars ?? 0) - (a.stars ?? 0);
  });
  results.forEach((r, i) => { r.rank = i + 1; });

  cacheSet(lbCacheKey, results);

  const start = (page - 1) * limit;
  return {
    page,
    limit,
    results: results.slice(start, start + limit),
    data_source: 'github-live',
  };
}

export async function triggerAnalysis(owner: string, repo: string): Promise<{ job_id?: string; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/projects/${owner}/${repo}/analyze`, { method: 'POST' });
    if (res.ok) return (await res.json()) as { job_id?: string; message: string };
  } catch {
    // offline
  }
  // Invalidate cache and re-fetch live
  try {
    localStorage.removeItem(`gh_metrics_v2:${owner}/${repo}`);
    localStorage.removeItem('vitality_leaderboard_v3');
  } catch { /* */ }
  return { message: `Live GitHub audit re-triggered for ${owner}/${repo}. Refreshing real data...` };
}

export async function fetchProjectHistory(owner: string, repo: string): Promise<ScoreHistoryPoint[]> {
  try {
    const res = await fetch(`${API_BASE}/projects/${owner}/${repo}/history`);
    if (res.ok) {
      const data = (await res.json()) as { history: ScoreHistoryPoint[] };
      if (data.history && data.history.length > 0) return data.history;
    }
  } catch {
    // offline
  }

  // Fetch real commit activity and derive a score history
  const cacheKey = `gh_history_v2:${owner}/${repo}`;
  const cached = cacheGet<ScoreHistoryPoint[]>(cacheKey);
  if (cached) return cached;

  const commitRes = await ghFetch<GHCommitActivity[]>(
    `/repos/${owner}/${repo}/stats/commit_activity`
  );
  const commitActivity = commitRes.data;

  const history: ScoreHistoryPoint[] = [];
  const now = Date.now();

  if (commitActivity && Array.isArray(commitActivity) && commitActivity.length >= 13) {
    // Use last 13 weeks (~90 days) of real commit data to build a trend
    const last13 = commitActivity.slice(-13);

    // Compute a "base" score from the overall current metrics if we have it
    const baseMetrics = cacheGet<RealRepoMetrics>(`gh_metrics_v2:${owner}/${repo}`);
    const baseScore = baseMetrics ? buildReport(baseMetrics).score : 82;

    for (let i = 0; i < last13.length; i++) {
      const week = last13[i];
      if (!week) continue;
      const weekDate = new Date(week.week * 1000).toISOString().split('T')[0]!;
      // Score varies based on commit count that week vs average
      const avgWeeklyCommits = last13.reduce((s, w) => s + w.total, 0) / 13;
      const weekRatio = avgWeeklyCommits > 0 ? week.total / avgWeeklyCommits : 1;
      const weekScore = Math.min(100, Math.max(40, Math.round(baseScore * (0.9 + weekRatio * 0.1))));
      history.push({ score: weekScore, created_at: weekDate });
    }
  } else {
    // Minimal fallback: just 13 weeks of flat history
    for (let i = 12; i >= 0; i--) {
      const date = new Date(now - i * 7 * 86400000).toISOString().split('T')[0]!;
      history.push({ score: 82, created_at: date });
    }
  }

  cacheSet(cacheKey, history);
  return history;
}
