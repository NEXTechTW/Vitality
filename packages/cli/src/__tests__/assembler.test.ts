import { describe, it, expect } from 'vitest';
import { assembleReport } from '../assembler.js';
import type { ScoringEngineOutput } from '@vitality/scoring-engine';

describe('assembler', () => {
  const dummyOutput: ScoringEngineOutput = {
    project: 'test/repo',
    score: 88,
    algorithmVersion: '1.0.0',
    computationHash: `sha256:${'a'.repeat(64)}`,
    maintenance: {
      score: 90,
      breakdown: [{ label: 'Fast issue triage', delta: 25 }],
    },
    community: {
      score: 85,
      breakdown: [{ label: 'High diversity', delta: 30 }],
    },
    security: {
      score: 95,
      breakdown: [{ label: 'No CVEs', delta: 40 }],
    },
    releases: {
      score: 82,
      breakdown: [{ label: 'Healthy cadence', delta: 30 }],
    },
  };

  it('assembles a report matching schema', () => {
    const report = assembleReport(dummyOutput, {
      knownVulnerabilities: 0,
      activeContributors: 15,
      avgDaysBetweenReleases: 14,
      releaseIntervalStdDev: 5,
    });

    expect(report.project).toBe('test/repo');
    expect(report.score).toBe(88);
    expect(report.security.dependency_risk).toBe('none');
    expect(report.releases.frequency).toBe('frequent');
    expect(report.releases.stability).toBe('high');
    expect(report.provenance.algorithm_version).toBe('1.0.0');
    expect(report.provenance.reproducible).toBe(true);
  });
});
