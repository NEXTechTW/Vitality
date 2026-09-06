/**
 * Raw GitHub data types — these are the raw shapes returned by the GitHub API.
 * They exist ONLY inside the collectors package. Nothing downstream should ever
 * see these shapes directly.
 */
export interface RawRelease {
    tagName: string;
    publishedAt: string;
    isPrerelease: boolean;
    isDraft: boolean;
    name: string | null;
    descriptionHTML: string | null;
}
export interface RawIssue {
    number: number;
    createdAt: string;
    closedAt: string | null;
    state: 'OPEN' | 'CLOSED';
    labels: string[];
    firstResponseAt: string | null;
    authorLogin: string;
}
export interface RawPullRequest {
    number: number;
    createdAt: string;
    mergedAt: string | null;
    closedAt: string | null;
    state: 'OPEN' | 'CLOSED' | 'MERGED';
    authorLogin: string;
    firstReviewAt: string | null;
    additions: number;
    deletions: number;
    changedFiles: number;
}
export interface RawContributor {
    login: string;
    commitCount: number;
    firstCommitAt: string;
    lastCommitAt: string;
    isBot: boolean;
}
export interface RawDependency {
    name: string;
    version: string;
    ecosystem: 'npm' | 'pip' | 'cargo' | 'maven' | 'go' | 'nuget' | 'unknown';
    isDirect: boolean;
}
export interface RawVulnerability {
    id: string;
    cvssScore: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    packageName: string;
    affectedVersions: string[];
    summary: string;
}
/**
 * The full raw repository data object.
 * This is the output of the collectors layer and the ONLY input the normalizer accepts.
 * No GitHub-specific shapes leak past this boundary.
 */
export interface RawRepoData {
    owner: string;
    repo: string;
    collectedAt: string;
    windowDays: number;
    releases: RawRelease[];
    issues: RawIssue[];
    pullRequests: RawPullRequest[];
    contributors: RawContributor[];
    dependencies: RawDependency[];
    vulnerabilities: RawVulnerability[];
    /** Unix timestamp of the repository creation */
    createdAtMs: number;
    /** The default branch name */
    defaultBranch: string;
}
//# sourceMappingURL=types.d.ts.map