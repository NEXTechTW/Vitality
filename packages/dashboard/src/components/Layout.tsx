import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import styles from './Layout.module.css';

export function Layout() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const slug = search.trim().replace(/^https?:\/\/github\.com\//, '');
    if (slug.includes('/')) {
      const [owner, repo] = slug.split('/');
      navigate(`/projects/${owner}/${repo}`);
      setSearch('');
    }
  }

  return (
    <div className={styles.root}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoIcon}>⚡</span>
            <span className={styles.logoText}>Vitality</span>
          </Link>

          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              id="global-search"
              className={`input ${styles.searchInput}`}
              type="text"
              placeholder="owner/repo or GitHub URL…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search for a repository"
            />
            <button id="global-search-btn" type="submit" className={`btn btn-primary ${styles.searchBtn}`}>
              Analyze
            </button>
          </form>

          <div className={styles.navLinks}>
            <Link to="/leaderboard" className={styles.navLink}>Leaderboard</Link>
            <a href="https://github.com/vitality/vitality" className={styles.navLink} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </div>
      </nav>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span className={styles.footerText}>
            <strong>Vitality</strong> — An open standard for Open Source health.
          </span>
          <span className={styles.footerLinks}>
            <a href="https://github.com/vitality/vitality" target="_blank" rel="noreferrer">GitHub</a>
            <a href="/docs/PROTOCOL.md" target="_blank" rel="noreferrer">Protocol</a>
            <a href="/docs/SCORING.md" target="_blank" rel="noreferrer">Scoring</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
