/**
 * Fastify API server — main entry point.
 */
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import postgres from 'postgres';
import RedisModule, { type Redis } from 'ioredis';
import { projectRoutes } from './routes/projects.js';
import { badgeRoutes } from './routes/badge.js';
import { leaderboardRoutes } from './routes/leaderboard.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RedisConstructor = ((RedisModule as any).default ?? RedisModule) as unknown as new (...args: any[]) => Redis;

export async function buildServer() {
  const isDev = process.env['NODE_ENV'] !== 'production';
  const app = Fastify({
    logger: isDev
      ? {
          level: process.env['LOG_LEVEL'] ?? 'info',
          transport: { target: 'pino-pretty', options: { colorize: true } },
        }
      : {
          level: process.env['LOG_LEVEL'] ?? 'info',
        },
  });

  // ── Database connection ───────────────────────────────────────────────────
  const sql = postgres(process.env['DATABASE_URL'] ?? 'postgres://localhost/vitality');
  const redis = new RedisConstructor(process.env['REDIS_URL'] ?? 'redis://localhost:6379');

  // Decorate fastify with shared dependencies
  app.decorate('sql', sql);
  app.decorate('redis', redis);

  // ── Plugins ───────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: process.env['CORS_ORIGIN'] ?? '*',
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // ── Routes ────────────────────────────────────────────────────────────────
  await app.register(projectRoutes, { prefix: '/v1/projects' });
  await app.register(badgeRoutes, { prefix: '/v1/badge' });
  await app.register(leaderboardRoutes, { prefix: '/v1/leaderboard' });

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  return { app, sql, redis };
}

// Start server when run directly
const isDirect = process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js');
if (isDirect) {
  const { app } = await buildServer();
  await app.listen({
    port: parseInt(process.env['PORT'] ?? '3001', 10),
    host: '0.0.0.0',
  });
}
