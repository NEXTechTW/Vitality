/**
 * Vitality Scoring Engine — Main Entry Point
 *
 * computeScore() is the one pure function that ties everything together.
 * It is the ONLY function consumers should call.
 *
 * Architectural constraints (enforced by dependency-cruiser in CI):
 * - This file MUST NOT import any HTTP client, filesystem module, or LLM SDK.
 * - All I/O is the responsibility of the collectors package.
 */
import { createHash } from 'node:crypto';

import type { NormalizedRepoData, ScoringEngineOutput } from './types.js';
import { DIMENSION_WEIGHTS, ALGORITHM_VERSION } from './config.js';
import { scoreMaintenance } from './dimensions/maintenance.js';
import { scoreCommunity } from './dimensions/community.js';
import { scoreSecurity } from './dimensions/security.js';
import { scoreReleases } from './dimensions/releases.js';

/**
 * Compute the Vitality health score for a repository.
 *
 * This is a pure function:
 * - Given the same NormalizedRepoData, it always produces the same output.
 * - It makes no network calls.
 * - It reads no files.
 * - It calls no LLMs.
 *
 * @param data - Normalized repository data from the collectors/normalizer layer
 * @returns Full scoring output including per-dimension breakdowns and computation hash
 */
export function computeScore(data: NormalizedRepoData): ScoringEngineOutput {
  // Score each dimension independently
  const maintenance = scoreMaintenance(data.maintenance);
  const community = scoreCommunity(data.community);
  const security = scoreSecurity(data.security);
  const releases = scoreReleases(data.releases);

  // Weighted overall score
  const overallRaw =
    maintenance.score * DIMENSION_WEIGHTS.maintenance +
    community.score * DIMENSION_WEIGHTS.community +
    security.score * DIMENSION_WEIGHTS.security +
    releases.score * DIMENSION_WEIGHTS.releases;

  const score = Math.max(0, Math.min(100, Math.round(overallRaw)));

  // Computation hash — SHA-256 over (normalized input JSON + algorithm version)
  // This allows any third party to re-run the engine on the same data and verify the hash.
  const hashInput = JSON.stringify({
    algorithmVersion: ALGORITHM_VERSION,
    data,
  });
  const computationHash = `sha256:${createHash('sha256').update(hashInput, 'utf8').digest('hex')}`;

  return {
    project: data.project,
    score,
    maintenance,
    community,
    security,
    releases,
    computationHash,
    algorithmVersion: ALGORITHM_VERSION,
  };
}
