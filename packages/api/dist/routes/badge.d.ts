/**
 * Badge SVG endpoint — GET /v1/badge/:owner/:repo.svg
 * Returns a shields.io-style SVG badge with the health score.
 */
import type { FastifyPluginAsync } from 'fastify';
export declare function scoreColor(score: number): string;
export declare function grade(score: number): string;
export declare function buildSvg(owner: string, repo: string, score: number | null): string;
export declare const badgeRoutes: FastifyPluginAsync;
//# sourceMappingURL=badge.d.ts.map