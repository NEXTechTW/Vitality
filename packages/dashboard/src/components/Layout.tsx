import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { verifyGitHubToken, sanitizeToken, getStoredGitHubToken } from '../api.js';
import styles from './Layout.module.css';

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenInput, setTokenInput] = useState(() => getStoredGitHubToken() || '');
  const [hasToken, setHasToken] = useState(() => !!getStoredGitHubToken());
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleVerifyAndSave = async () => {
    const clean = sanitizeToken(tokenInput);
    if (!clean) {
      clearToken();
      return;
    }

    setVerifying(true);
    setVerifyStatus(null);
    try {
      const result = await verifyGitHubToken(clean);
      if (result.valid) {
        localStorage.setItem('vitality_github_token', clean);
        setHasToken(true);
        setVerifyStatus({
          type: 'success',
          message: `Connected as @${result.username || 'user'}! Limit: ${result.limit.toLocaleString()} req/hr (${result.remaining.toLocaleString()} remaining). Reloading...`,
        });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setVerifyStatus({
          type: 'error',
          message: result.error || 'Invalid token. Please check and try again.',
        });
      }
    } catch (e: unknown) {
      setVerifyStatus({
        type: 'error',
        message: e instanceof Error ? e.message : 'Network error verifying token',
      });
    } finally {
      setVerifying(false);
    }
  };

  const clearToken = () => {
    try {
      localStorage.removeItem('vitality_github_token');
      localStorage.removeItem('github_token');
      setTokenInput('');
      setHasToken(false);
      setVerifyStatus({ type: 'info', message: 'Token removed. Reloading...' });
    } catch { /* ignore */ }
    setTimeout(() => {
      setShowTokenModal(false);
      window.location.reload();
    }, 800);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const slug = search.trim().replace(/^https?:\/\/github\.com\//, '');
    if (slug.includes('/')) {
      const [owner, repo] = slug.split('/');
      navigate(`/projects/${owner}/${repo}`);
      setSearch('');
      inputRef.current?.blur();
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.ambientGlow} aria-hidden="true" />

      {/* ── Top Navbar ── */}
      <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
        <div className={styles.navInner}>
          <Link to="/" className={styles.logo} aria-label="Vitality Home">
            <div className={styles.logoIconWrap}>
              <span className={styles.logoIcon}>⚡</span>
              <div className={styles.logoRing} />
            </div>
            <span className={styles.logoText}>Vitality</span>
            <span className={styles.versionPill}>v1.0</span>
          </Link>

          {/* Quick Search */}
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.searchWrapper}>
              <svg
                className={styles.searchIcon}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={inputRef}
                id="global-search"
                className={styles.searchInput}
                type="text"
                placeholder="Search owner/repo (e.g. vercel/next.js)…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search repository"
              />
              <kbd className={styles.kbdShortcut}>/</kbd>
            </div>
          </form>

          {/* Nav Navigation Links */}
          <nav className={styles.navLinks}>
            <Link
              to="/leaderboard"
              className={`${styles.navLink} ${location.pathname === '/leaderboard' ? styles.navLinkActive : ''}`}
            >
              <span className={styles.navLinkIcon}>🏆</span>
              <span>Leaderboard</span>
            </Link>

            <button
              id="nav-token-btn"
              type="button"
              className={`${styles.tokenBtn} ${hasToken ? styles.tokenBtnActive : ''}`}
              onClick={() => setShowTokenModal(true)}
              title="GitHub API Token (Rate limits: 60 unauth vs 5,000 auth/hr)"
            >
              <span className={styles.tokenIcon}>🔑</span>
              <span>{hasToken ? 'Token Active' : 'API Token'}</span>
            </button>

            <a
              href="https://github.com/NEXTechTW/Vitality"
              className={styles.githubLink}
              target="_blank"
              rel="noreferrer"
            >
              <svg className={styles.ghSvg} viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </a>
          </nav>
        </div>
        <div className={styles.headerGlowLine} />
      </header>

      {/* ── Optional GitHub Token Modal ── */}
      {showTokenModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowTokenModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>🔑 GitHub API Token</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowTokenModal(false)}
              >
                ✕
              </button>
            </div>
            <p className={styles.modalDesc}>
              Vitality fetches real telemetry directly from GitHub’s REST API. Without a token, GitHub limits unauthenticated queries to <strong>60 requests/hour per IP</strong>.
            </p>
            <p className={styles.modalDesc}>
              Adding a standard GitHub Personal Access Token (PAT) unlocks <strong>5,000 requests/hour</strong>. No special permissions or scopes are required for public open source repositories.
            </p>

            {verifyStatus && (
              <div className={`${styles.statusBanner} ${verifyStatus.type === 'success' ? styles.statusSuccess : verifyStatus.type === 'error' ? styles.statusError : styles.statusInfo}`}>
                {verifyStatus.message}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleVerifyAndSave(); }}>
              <div className={styles.modalInputGroup}>
                <label htmlFor="gh-token-input" className={styles.modalLabel}>
                  GitHub Personal Access Token:
                </label>
                <input
                  id="gh-token-input"
                  type="password"
                  className={styles.modalInput}
                  placeholder="ghp_... or github_pat_..."
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value);
                    setVerifyStatus(null);
                  }}
                  autoFocus
                />
                <span className={styles.tokenHelp}>
                  Don't have one?{' '}
                  <a
                    href="https://github.com/settings/tokens/new?description=Vitality+Dashboard&scopes="
                    target="_blank"
                    rel="noreferrer"
                  >
                    Generate free read-only token on GitHub ↗
                  </a>
                </span>
              </div>
              <div className={styles.modalActions}>
                {hasToken && (
                  <button type="button" className={styles.modalClearBtn} onClick={clearToken}>
                    Clear Token
                  </button>
                )}
                <button type="button" className={styles.modalCancelBtn} onClick={() => setShowTokenModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.modalSaveBtn}
                  disabled={verifying}
                >
                  {verifying ? 'Verifying with GitHub...' : 'Verify & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Main Content Area with Page Transitions ── */}
      <main className={styles.main}>
        <Outlet />
      </main>

      {/* ── Modern Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <span className={styles.footerLogoIcon}>⚡</span>
              <span className={styles.footerLogoText}>Vitality</span>
            </div>
            <p className={styles.footerTagline}>
              Deterministic, cryptographic health telemetry & mathematical viability scoring for open source ecosystems.
            </p>
            <div className={styles.footerStatus}>
              <span className={styles.statusPulse} />
              <span className={styles.statusText}>Protocol Engine: Deterministic SHA-256</span>
            </div>
          </div>

          <div className={styles.footerNav}>
            <div className={styles.footerCol}>
              <span className={styles.colTitle}>Platform</span>
              <Link to="/">Home Overview</Link>
              <Link to="/leaderboard">Leaderboard</Link>
              <a href="https://github.com/NEXTechTW/Vitality" target="_blank" rel="noreferrer">
                CLI Quickstart
              </a>
            </div>

            <div className={styles.footerCol}>
              <span className={styles.colTitle}>Protocol</span>
              <a href="https://github.com/NEXTechTW/Vitality/blob/master/README.md" target="_blank" rel="noreferrer">
                Specification
              </a>
              <a href="https://github.com/NEXTechTW/Vitality" target="_blank" rel="noreferrer">
                Scoring Math
              </a>
              <a href="https://osv.dev/" target="_blank" rel="noreferrer">
                OSV Database
              </a>
            </div>

            <div className={styles.footerCol}>
              <span className={styles.colTitle}>Ecosystem</span>
              <a href="https://github.com/NEXTechTW/Vitality" target="_blank" rel="noreferrer">
                GitHub Action
              </a>
              <a href="https://github.com/NEXTechTW/Vitality" target="_blank" rel="noreferrer">
                Badges API
              </a>
              <a href="https://github.com/NEXTechTW/Vitality/blob/master/LICENSE" target="_blank" rel="noreferrer">
                MIT License
              </a>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <div className={styles.footerBottomInner}>
            <span>© {new Date().getFullYear()} Vitality Project. Pure deterministic mathematics.</span>
            <span>Zero LLM Hallucinations · 100% Reproducible</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
