import { describe, it, expect } from 'vitest';
import { normalize } from '../normalizer.js';
import type { RawRepoData } from '../types.js';

describe('normalizer', () => {
  const baseRaw: RawRepoData = {
    owner: 'test',
    repo: 'repo',
    collectedAt: new Date().toISOString(),
    createdAtMs: Date.now() - 365 * 86400000,
    defaultBranch: 'main',
    windowDays: 90,
    releases: [
      {
        tagName: 'v1.1.0',
        publishedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        isPrerelease: false,
        isDraft: false,
        name: 'v1.1.0',
        descriptionHTML: null,
      },
      {
        tagName: 'v1.0.0',
        publishedAt: new Date(Date.now() - 40 * 86400000).toISOString(),
        isPrerelease: false,
        isDraft: false,
        name: 'v1.0.0',
        descriptionHTML: null,
      },
    ],
    issues: [
      {
        number: 1,
        createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
        closedAt: new Date(Date.now() - 19 * 86400000).toISOString(),
        firstResponseAt: new Date(Date.now() - 19.5 * 86400000).toISOString(),
        state: 'CLOSED',
        labels: [],
        authorLogin: 'alice',
      },
    ],
    pullRequests: [
      {
        number: 10,
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        mergedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        closedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        firstReviewAt: new Date(Date.now() - 14.5 * 86400000).toISOString(),
        state: 'MERGED',
        authorLogin: 'bob',
        additions: 100,
        deletions: 20,
        changedFiles: 5,
      },
    ],
    contributors: [
      {
        login: 'alice',
        commitCount: 50,
        firstCommitAt: new Date(Date.now() - 60 * 86400000).toISOString(),
        lastCommitAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        isBot: false,
      },
      {
        login: 'bob',
        commitCount: 45,
        firstCommitAt: new Date(Date.now() - 50 * 86400000).toISOString(),
        lastCommitAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        isBot: false,
      },
      {
        login: 'dependabot[bot]',
        commitCount: 100,
        firstCommitAt: new Date(Date.now() - 80 * 86400000).toISOString(),
        lastCommitAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        isBot: true,
      },
    ],
    dependencies: [
      { name: 'lodash', version: '4.17.21', ecosystem: 'npm', isDirect: true },
    ],
    vulnerabilities: [],
  };

  it('normalizes raw data within rolling window', () => {
    const norm = normalize(baseRaw);
    expect(norm.project).toBe('test/repo');
    expect(norm.windowDays).toBe(90);
    expect(norm.maintenance.releasesInWindow).toBe(2);
    expect(norm.community.activeContributors).toBe(2); // dependabot filtered out!
  });

  it('filters out bot accounts from contributor count and diversity', () => {
    const norm = normalize(baseRaw);
    expect(norm.community.activeContributors).toBe(2);
    expect(norm.community.contributorDiversityIndex).toBeGreaterThan(0.7);
  });

  it('correctly tracks zero vulnerabilities', () => {
    const norm = normalize(baseRaw);
    expect(norm.security.knownVulnerabilities).toBe(0);
    expect(norm.security.maxCvssScore).toBe(0);
  });
});
