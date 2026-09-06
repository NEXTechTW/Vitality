/**
 * Fastify API server — main entry point.
 */
import Fastify from 'fastify';
import postgres from 'postgres';
import RedisModule from 'ioredis';
export declare function buildServer(): Promise<{
    app: Fastify.FastifyInstance<import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, Fastify.FastifyBaseLogger, Fastify.FastifyTypeProviderDefault> & PromiseLike<Fastify.FastifyInstance<import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, Fastify.FastifyBaseLogger, Fastify.FastifyTypeProviderDefault>> & {
        __linterBrands: "SafePromiseLike";
    };
    sql: postgres.Sql<{}>;
    redis: RedisModule.Redis;
}>;
//# sourceMappingURL=index.d.ts.map