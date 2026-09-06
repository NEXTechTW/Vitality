#!/usr/bin/env node
/**
 * Vitality CLI entry point
 */
import { Command } from 'commander';
import ora from 'ora';
import { analyzeCommand } from './commands/analyze.js';

const program = new Command();

program
  .name('vitality')
  .description('Know the health of your open source.')
  .version('0.1.0');

program
  .command('analyze <owner/repo>')
  .description('Analyze a GitHub repository and produce a health score.')
  .option('-o, --output <path>', 'Path to write vitality.json', 'vitality.json')
  .option('-b, --breakdown', 'Show per-dimension score breakdown', false)
  .option('-w, --window <days>', 'Analysis window in days', '90')
  .option('-t, --token <token>', 'GitHub personal access token (or set GITHUB_TOKEN)')
  .action(async (slug: string, options: { output?: string; breakdown?: boolean; window?: string; token?: string }) => {
    const spinner = ora({ color: 'green' });
    try {
      await analyzeCommand(slug, options, {
        start: (t) => spinner.start(t),
        succeed: (t) => spinner.succeed(t),
        fail: (t) => spinner.fail(t),
      });
    } catch (err) {
      spinner.fail(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

program
  .command('report <owner/repo>')
  .description('Show the latest health report (reads vitality.json if present).')
  .option('-i, --input <path>', 'Path to vitality.json', 'vitality.json')
  .action(async (slug: string, options: { input?: string }) => {
    try {
      const { readFileSync } = await import('node:fs');
      const { renderReport, renderBreakdown } = await import('./renderer/terminal.js');
      const { computeScore } = await import('@vitality/scoring-engine');

      const raw = JSON.parse(readFileSync(options.input ?? 'vitality.json', 'utf8')) as {
        score: number;
        project: string;
        maintenance: { score: number; breakdown: { label: string; delta: number }[] };
        community: { score: number; breakdown: { label: string; delta: number }[] };
        security: { score: number; breakdown: { label: string; delta: number }[] };
        releases: { score: number; breakdown: { label: string; delta: number }[] };
        provenance: { computation_hash: string; algorithm_version: string };
      };

      // Re-render from the saved report
      const mockResult = {
        project: raw.project,
        score: raw.score,
        maintenance: raw.maintenance,
        community: raw.community,
        security: raw.security,
        releases: raw.releases,
        computationHash: raw.provenance.computation_hash,
        algorithmVersion: raw.provenance.algorithm_version,
      };

      process.stdout.write(renderReport(mockResult));
      process.stdout.write(renderBreakdown(mockResult));
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
