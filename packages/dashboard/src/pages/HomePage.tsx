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

const STATS = [
  { value: '100%', label: 'Deterministic Math', sub: 'Zero stochastic LLM output' },
  { value: '4', label: 'Core Dimensions', sub: 'Velocity, Diversity, Security, Cadence' },
  { value: 'SHA-256', label: 'Audit Provenance', sub: 'Every score is reproducible' },
  { value: '0s', label: 'Network Wait in Engine', sub: 'Strict separation of I/O & math' },
];

export function HomePage() {
  const navigate = useNavigate();
  const [repoInput, setRepoInput] = useState('');
  const [copiedCli, setCopiedCli] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = repoInput.trim().replace(/^https?:\/\/github\.com\//, '');
    if (clean.includes('/')) {
      navigate(`/projects/${clean}`);
    }
  };

  const copyCliCommand = () => {
    navigator.clipboard?.writeText('npx @vitality/cli analyze facebook/react');
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <div className={styles.container}>
      {/* ── Background Radiant Orb ── */}
      <div className={styles.heroOrb} aria-hidden="true" />

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <span className={styles.pulseDot} />
          <span>Vitality Protocol v1.0.0</span>
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
            <svg
              className={styles.inputIcon}
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
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
            <span>Analyze Project</span>
            <span className={styles.btnArrow}>→</span>
          </button>
        </form>

        <div className={styles.suggestions}>
          <span className={styles.suggLabel}>Quick Try:</span>
          <div className={styles.chipsRow}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className={styles.suggChip}
                onClick={() => navigate(`/projects/${s}`)}
              >
                <span>{s}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Key Metrics Strip ── */}
      <section className={styles.statsStrip}>
        {STATS.map((st) => (
          <div key={st.label} className={styles.statCard}>
            <span className={styles.statValue}>{st.value}</span>
            <span className={styles.statLabel}>{st.label}</span>
            <span className={styles.statSub}>{st.sub}</span>
          </div>
        ))}
      </section>

      {/* ── Featured Projects ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <div className={styles.sectionBadge}>CONTINUOUS TELEMETRY</div>
            <h2 className={styles.sectionTitle}>Featured Repository Audits</h2>
            <p className={styles.sectionSubtitle}>
              Live health scores continuously tracked across premier open source codebases
            </p>
          </div>
          <Link to="/leaderboard" className={styles.viewAllLink}>
            <span>View Full Leaderboard</span>
            <span className={styles.arrowIcon}>→</span>
          </Link>
        </div>

        <div className={styles.featuredGrid}>
          {FEATURED.map((f) => (
            <Link
              key={f.repo}
              to={`/projects/${f.repo}`}
              className={styles.projectCard}
            >
              <div className={styles.cardGlow} />
              <div className={styles.cardTop}>
                <div className={styles.cardHeader}>
                  <div className={styles.repoHeaderRow}>
                    <span className={styles.cardRepoIcon}>📦</span>
                    <h3 className={styles.repoName}>{f.repo}</h3>
                  </div>
                  <div className={styles.tagList}>
                    {f.tags.map((t) => (
                      <span key={t} className={styles.tag}>{t}</span>
                    ))}
                  </div>
                </div>
                <div className={styles.gaugeMini}>
                  <ScoreGauge score={f.score} size={88} />
                </div>
              </div>
              <p className={styles.cardDesc}>{f.description}</p>
              <div className={styles.cardFooter}>
                <span className={styles.viewReport}>Inspect Telemetry & Math</span>
                <span className={styles.viewArrow}>→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Core Principles ── */}
      <section className={styles.pillarsSection}>
        <div className={styles.pillarsHeader}>
          <div className={styles.sectionBadge}>ARCHITECTURAL PRINCIPLES</div>
          <h2 className={styles.pillarsTitle}>Why Vitality?</h2>
          <p className={styles.pillarsSub}>Engineered for security compliance and engineering governance</p>
        </div>

        <div className={styles.pillarsGrid}>
          <div className={styles.pillarCard}>
            <div className={styles.pillarIcon}>⚡</div>
            <h3>Pure Deterministic Math</h3>
            <p>
              Zero LLM hallucinations. The scoring engine contains no network or file I/O. The exact same repository snapshot produces the identical SHA-256 computation hash every single time.
            </p>
          </div>

          <div className={styles.pillarCard}>
            <div className={styles.pillarIcon}>🛡️</div>
            <h3>Multi-Dimensional Health</h3>
            <p>
              A single star count is vanity. Vitality computes 4 orthogonal dimensions: Maintenance velocity, Contributor Gini diversity, OSV vulnerability tracking, and Release cadence stability.
            </p>
          </div>

          <div className={styles.pillarCard}>
            <div className={styles.pillarIcon}>🎯</div>
            <h3>CI/CD Policy Enforcement</h3>
            <p>
              Integrate <code className={styles.code}>vitality analyze</code> directly in GitHub Actions. Enforce minimum score thresholds to automatically gate brittle or abandoned dependencies.
            </p>
          </div>
        </div>
      </section>

      {/* ── CLI Preview ── */}
      <section className={styles.cliSection}>
        <div className={styles.cliCard}>
          <div className={styles.cliTop}>
            <div className={styles.cliDots}>
              <span className={styles.dotRed} />
              <span className={styles.dotYellow} />
              <span className={styles.dotGreen} />
            </div>
            <span className={styles.cliTitle}>Terminal / GitHub Actions Workflow</span>
            <button
              type="button"
              className={styles.copyCliBtn}
              onClick={copyCliCommand}
              title="Copy command"
            >
              {copiedCli ? '✔ Copied' : 'Copy Command'}
            </button>
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
              <span className={styles.cliSuccess}>✔ Provenance Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>{'\n'}
              <span className={styles.cliSuccess}>✔ Report saved to vitality.json</span>
            </code>
          </pre>
        </div>
      </section>
    </div>
  );
}
