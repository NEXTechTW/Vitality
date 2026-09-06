/**
 * /v1/projects routes
 *
 * GET  /v1/projects/:owner/:repo          — latest health report
 * POST /v1/projects/:owner/:repo/analyze  — trigger fresh analysis (async)
 * GET  /v1/projects/:owner/:repo/history  — historical score time series
 */
import type { FastifyPluginAsync } from 'fastify';
import type postgres from 'postgres';
import type { Redis } from 'ioredis';
declare module 'fastify' {
    interface FastifyInstance {
        sql: postgres.Sql;
        redis: Redis;
    }
}
export declare const projectRoutes: FastifyPluginAsync;
//# sourceMappingURL=projects.d.ts.map