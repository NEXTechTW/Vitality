import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ScoreGauge } from '../components/ScoreGauge.js';
import styles from './HomePage.module.css';

const FEATURED = [
  {
    repo: 'vercel/next.js',
    score: 94,
    grade: 'A',
    description: 'Ultra-fast issue turnaround, weekly releases, highly active global contributor base.',
    tags: ['React Framework', 'TypeScript'],
  },
  {
    repo: 'facebook/react',
    score: 92,
    grade: 'A',
    description: 'Exceptional contributor diversity, stable semantic releases, zero unpatched CVEs.',
    tags: ['UI Library', 'Ecosystem Anchor'],
  },
  {
    repo: 'tailwindlabs/tailwindcss',
    score: 91,
    grade: 'A',
    description: 'High velocity maintenance, consistent patch releases, strong maintainer responsiveness.',
    tags: ['CSS', 'Developer Tooling'],
  },
];

const SUGGESTIONS = ['vercel/next.js', 'facebook/react', 'astral-sh/uv', 'fastify/fastify'];

export function HomePage() {
  const navigate = useNavigate();
  const [repoInput, setRepoInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = repoInput.trim().replace(/^https?:\/\/github\.com\//, '');
    if (clean.includes('/')) {
      navigate(`/projects/${clean}`);
    }
  };

  return (
    <div className={styles.container}>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <span>✨ Vitality Protocol v1.0.0</span>
          <span className={styles.heroBadgeDot}>·</span>
          <span>Open Source Health Standard</span>
        </div>
        <h1 className={styles.title}>
          Deterministic Health Scores for{' '}
          <span className={styles.gradientText}>Open Source</span>
        </h1>
        <p className={styles.subtitle}>
          Stop guessing project viability. Vitality synthesizes rolling GitHub activity, contributor Gini diversity, and OSV security advisories into an audit-grade, reproducible score.
        </p>

        {/* ── Search Form ── */}
        <form className={styles.searchForm} onSubmit={handleSubmit}>
          <div className={styles.inputWrapper}>
            <span className={styles.inputIcon}>🔍</span>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. facebook/react or vercel/next.js"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              aria-label="Repository slug"
            />
          </div>
          <button type="submit" className={styles.submitBtn}>
            Analyze Project
          </button>
        </form>

        <div className={styles.suggestions}>
          <span className={styles.suggLabel}>Try:</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className={styles.suggChip}
              onClick={() => navigate(`/projects/${s}`)}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* ── Featured Projects ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Featured Analyses</h2>
            <p className={styles.sectionSubtitle}>
              Continuous telemetry tracked across premier open source repositories
            </p>
          </div>
          <Link to="/leaderboard" className={styles.viewAllLink}>
            View Leaderboard →
          </Link>
        </div>

        <div className={styles.featuredGrid}>
          {FEATURED.map((f) => (
            <Link
              key={f.repo}
              to={`/projects/${f.repo}`}
              className={styles.projectCard}
            >
              <div className={styles.cardTop}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.repoName}>{f.repo}</h3>
                  <div className={styles.tagList}>
                    {f.tags.map((t) => (
                      <span key={t} className={styles.tag}>{t}</span>
                    ))}
                  </div>
                </div>
                <div className={styles.gaugeMini}>
                  <ScoreGauge score={f.score} size={90} />
                </div>
              </div>
              <p className={styles.cardDesc}>{f.description}</p>
              <div className={styles.cardFooter}>
                <span className={styles.viewReport}>Inspect Telemetry & Math →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Core Principles ── */}
      <section className={styles.pillarsSection}>
        <h2 className={styles.pillarsTitle}>Why Vitality?</h2>
        <div className={styles.pillarsGrid}>
          <div className={styles.pillarCard}>
            <div className={styles.pillarIcon}>⚡</div>
            <h3>Pure Deterministic Math</h3>
            <p>
              Zero LLM hallucinations. The scoring engine has no network or file I/O. The exact same repository snapshot produces the identical SHA-256 computation hash every single time.
            </p>
          </div>

          <div className={styles.pillarCard}>
            <div className={styles.pillarIcon}>🛡️</div>
            <h3>Multi-Dimensional Health</h3>
            <p>
              A single star count is meaningless. Vitality computes 4 orthogonal dimensions: Maintenance velocity, Community contributor Gini diversity, OSV vulnerability tracking, and Release cadence stability.
            </p>
          </div>

          <div className={styles.pillarCard}>
            <div className={styles.pillarIcon}>🎯</div>
            <h3>CI/CD Policy Enforcement</h3>
            <p>
              Integrate <code className={styles.code}>vitality analyze</code> in GitHub Actions. Enforce minimum score thresholds to automatically block brittle, abandoned, or vulnerable dependencies.
            </p>
          </div>
        </div>
      </section>

      {/* ── CLI Preview ── */}
      <section className={styles.cliSection}>
        <div className={styles.cliCard}>
          <div className={styles.cliTop}>
            <div className={styles.cliDots}>
              <span />
              <span />
              <span />
            </div>
            <span className={styles.cliTitle}>Terminal / GitHub Actions</span>
          </div>
          <pre className={styles.cliCode}>
            <code>
              <span className={styles.cliPrompt}>$</span> npx @vitality/cli analyze facebook/react{'\n'}
              <span className={styles.cliDim}>Fetching GitHub events & OSV vulnerability records...</span>{'\n'}
              {'\n'}
              <span className={styles.cliSuccess}>Vitality Health Report: facebook/react</span>{'\n'}
              <span className={styles.cliHighlight}>Overall Score: 92 / 100 [A]</span>{'\n'}
              {'\n'}
              Maintenance: [██████████████████░░]  91/100{'\n'}
              Community:   [███████████████████░]  96/100{'\n'}
              Security:    [███████████████████░]  95/100{'\n'}
              Releases:    [█████████████████░░░]  87/100{'\n'}
              {'\n'}
              <span className={styles.cliSuccess}>✔ Report saved to vitality.json</span>
            </code>
          </pre>
        </div>
      </section>
    </div>
  );
}
