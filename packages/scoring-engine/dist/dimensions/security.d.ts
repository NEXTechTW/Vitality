/**
 * Security Dimension Scorer
 *
 * Pure function — no I/O, no side effects, no CVE lookups.
 * The collector/normalizer resolves CVEs before this function is called.
 * This function only processes pre-normalized security data.
 */
import type { NormalizedSecurity, DimensionScoreResult } from '../types.js';
export declare function scoreSecurity(data: NormalizedSecurity): DimensionScoreResult;
//# sourceMappingURL=security.d.ts.map