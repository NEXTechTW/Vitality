/**
 * Badge SVG endpoint — GET /v1/badge/:owner/:repo.svg
 * Returns a shields.io-style SVG badge with the health score.
 */
import type { FastifyPluginAsync } from 'fastify';

export function scoreColor(score: number): string {
  if (score >= 90) return '#22c55e'; // green-500
  if (score >= 75) return '#84cc16'; // lime-500
  if (score >= 60) return '#eab308'; // yellow-500
  if (score >= 40) return '#f97316'; // orange-500
  return '#ef4444';                   // red-500
}

export function grade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C+';
  if (score >= 50) return 'C';
  return 'D';
}

export function buildSvg(owner: string, repo: string, score: number | null): string {
  const displayScore = score !== null ? `${score}/100` : 'unknown';
  const displayGrade = score !== null ? grade(score) : '?';
  const color = score !== null ? scoreColor(score) : '#6b7280';
  const leftWidth = 120;
  const rightWidth = 70;
  const totalWidth = leftWidth + rightWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="Vitality Health: ${displayScore}">
  <title>Vitality Health: ${displayScore}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftWidth}" height="20" fill="#555"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${leftWidth / 2}" y="15" fill="#010101" fill-opacity=".3">vitality health</text>
    <text x="${leftWidth / 2}" y="14">vitality health</text>
    <text x="${leftWidth + rightWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${displayScore} ${displayGrade}</text>
    <text x="${leftWidth + rightWidth / 2}" y="14">${displayScore} ${displayGrade}</text>
  </g>
</svg>`;
}

export const badgeRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Params: { owner: string; 'repo.svg': string } }>(
    '/:owner/:reposvg',
    async (req, reply) => {
      const owner = req.params.owner;
      // Strip .svg extension
      const repoParam = (req.params as Record<string, string>)['reposvg'] ?? '';
      const repo = repoParam.replace(/\.svg$/, '');

      // Look up latest score
      const rows = await app.sql<{ score: number }[]>`
        SELECT score FROM latest_snapshots
        WHERE owner = ${owner} AND repo = ${repo}
        LIMIT 1
      `;

      const score = rows[0]?.score ?? null;
      const svg = buildSvg(owner, repo, score);

      return reply
        .header('Content-Type', 'image/svg+xml')
        .header('Cache-Control', 'public, max-age=3600')
        .header('ETag', `"${owner}-${repo}-${score}"`)
        .send(svg);
    },
  );
};
