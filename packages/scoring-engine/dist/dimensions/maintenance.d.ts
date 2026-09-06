/**
 * Maintenance Dimension Scorer
 *
 * Pure function — no I/O, no side effects, no imports from outside this package.
 * Measures: issue response time, PR response time, merge rate, release recency, backlog trend.
 */
import type { NormalizedMaintenance, DimensionScoreResult } from '../types.js';
export declare function scoreMaintenance(data: NormalizedMaintenance): DimensionScoreResult;
//# sourceMappingURL=maintenance.d.ts.map