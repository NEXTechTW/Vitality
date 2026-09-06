import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchLeaderboard, type LeaderboardItem } from '../api.js';
import { ScoreGauge } from '../components/ScoreGauge.js';
import styles from './LeaderboardPage.module.css';

function gradeFromScore(score: number): { letter: string; color: string } {
  if (score >= 95) return { letter: 'A+', color: '#22c55e' };
  if (score >= 90) return { letter: 'A', color: '#4ade80' };
  if (score >= 80) return { letter: 'B+', color: '#84cc16' };
  if (score >= 70) return { letter: 'B', color: '#a3e635' };
  if (score >= 60) return { letter: 'C+', color: '#eab308' };
  if (score >= 50) return { letter: 'C', color: '#f59e0b' };
  return { letter: 'D', color: '#ef4444' };
}

function getScoreTierGradient(score: number): string {
  if (score >= 90) return 'linear-gradient(90deg, #10b981, #22c55e)';
  if (score >= 75) return 'linear-gradient(90deg, #84cc16, #a3e635)';
  if (score >= 60) return 'linear-gradient(90deg, #f59e0b, #eab308)';
  return 'linear-gradient(90deg, #ef4444, #f97316)';
}

function formatNumber(num?: number): string {
  if (!num) return '';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}

const LANGUAGES = ['all', 'TypeScript', 'JavaScript', 'Rust', 'Go', 'Python', 'C++'];

export function LeaderboardPage() {
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [dataSource, setDataSource] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | '90+' | '80-89' | 'below80'>('all');
  const [langFilter, setLangFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'score' | 'stars'>('score');

  const loadData = () => {
    setLoading(true);
    fetchLeaderboard(1, 50)
      .then((res) => {
        setItems(res.results);
        setDataSource(res.data_source ?? '');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAndSorted = useMemo(() => {
    return items
      .filter((item) => {
        // Text match
        const matchesText =
          item.project.toLowerCase().includes(filter.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(filter.toLowerCase()));
        if (!matchesText) return false;

        // Tier match
        if (tierFilter === '90+' && item.score < 90) return false;
        if (tierFilter === '80-89' && (item.score < 80 || item.score >= 90)) return false;
        if (tierFilter === 'below80' && item.score >= 80) return false;

        // Language match
        if (langFilter !== 'all' && item.language !== langFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'stars') {
          return (b.stars ?? 0) - (a.stars ?? 0);
        }
        return b.score - a.score;
      });
  }, [items, filter, tierFilter, langFilter, sortBy]);

  // Top 3 for the podium
  const rank1 = items[0];
  const rank2 = items[1];
  const rank3 = items[2];

  return (
    <div className={styles.container}>
      {/* ── Page Header ── */}
      <header className={styles.header}>
        <div className={styles.headerInfo}>
          <div className={styles.headerBadge}>
            <span className={dataSource === 'github-live' ? styles.badgeDotGreen : dataSource === 'rate-limited-cache' ? styles.badgeDotYellow : styles.badgeDot} />
            <span>
              {dataSource === 'github-live' ? '🟢 Real-time GitHub API Data' :
               dataSource === 'backend-api' ? '🔵 Backend API' :
               dataSource === 'rate-limited-cache' ? '🟡 Cached Results (30 min)' :
               '⏳ Loading from GitHub...'}
            </span>
            <span className={styles.badgeSep}>·</span>
            <span>Scores from Commit Velocity, Issue Resolution, Contributors &amp; CVEs</span>
          </div>
          <h1 className={styles.title}>Open Source Health Leaderboard</h1>
          <p className={styles.subtitle}>
            Real GitHub repositories ranked by live Vitality health scores — computed from actual commit frequency, issue resolution rates, contributor diversity, and OSV vulnerability data.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className={styles.filterCard}>
          <div className={styles.filterTopRow}>
            <div className={styles.searchWrap}>
              <svg className={styles.searchSvg} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className={styles.filterInput}
                placeholder="Search real GitHub repos (e.g. react, linux, rust)…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                aria-label="Filter repositories"
              />
              {filter && (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => setFilter('')}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort toggles */}
            <div className={styles.sortWrap}>
              <span className={styles.sortLabel}>Rank by:</span>
              <button
                type="button"
                className={`${styles.sortBtn} ${sortBy === 'score' ? styles.sortBtnActive : ''}`}
                onClick={() => setSortBy('score')}
              >
                ⚡ Health Score
              </button>
              <button
                type="button"
                className={`${styles.sortBtn} ${sortBy === 'stars' ? styles.sortBtnActive : ''}`}
                onClick={() => setSortBy('stars')}
              >
                ⭐ GitHub Stars
              </button>
            </div>
          </div>

          <div className={styles.filterBottomRow}>
            {/* Language filter */}
            <div className={styles.chipsGroup}>
              <span className={styles.groupLabel}>Language:</span>
              <div className={styles.chipsList}>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    className={`${styles.chip} ${langFilter === lang ? styles.chipActive : ''}`}
                    onClick={() => setLangFilter(lang)}
                  >
                    {lang === 'all' ? 'All Languages' : lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Score Tier filter */}
            <div className={styles.chipsGroup}>
              <span className={styles.groupLabel}>Health Tier:</span>
              <div className={styles.chipsList}>
                <button
                  type="button"
                  className={`${styles.chip} ${tierFilter === 'all' ? styles.chipActive : ''}`}
                  onClick={() => setTierFilter('all')}
                >
                  All ({items.length})
                </button>
                <button
                  type="button"
                  className={`${styles.chip} ${tierFilter === '90+' ? styles.chipActive : ''}`}
                  onClick={() => setTierFilter('90+')}
                >
                  Tier A (90+)
                </button>
                <button
                  type="button"
                  className={`${styles.chip} ${tierFilter === '80-89' ? styles.chipActive : ''}`}
                  onClick={() => setTierFilter('80-89')}
                >
                  Tier B (80–89)
                </button>
                <button
                  type="button"
                  className={`${styles.chip} ${tierFilter === 'below80' ? styles.chipActive : ''}`}
                  onClick={() => setTierFilter('below80')}
                >
                  &lt; 80
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Top 3 Podium (shown when not aggressively filtering) ── */}
      {!loading && rank1 && rank2 && rank3 && filter === '' && tierFilter === 'all' && langFilter === 'all' && (
        <section className={styles.podiumSection}>
          <div className={styles.podiumTitleRow}>
            <div className={styles.podiumTitleLeft}>
              <h2 className={styles.podiumHeading}>Top Ranked Open Source Repositories</h2>
              <span className={styles.podiumSub}>Live algorithmic benchmarks across premier software engineering projects</span>
            </div>
            <span className={styles.liveIndicator}>
              <span className={styles.pulseDot} /> GitHub Data Synced
            </span>
          </div>

          <div className={styles.podiumGrid}>
            {/* Rank 2 (Silver) */}
            <div className={`${styles.podiumCard} ${styles.podiumSilver}`}>
              <div className={styles.podiumRankBadge}>
                <span>🥈 2nd Rank</span>
              </div>
              <div className={styles.podiumGauge}>
                <ScoreGauge score={rank2.score} size={110} />
              </div>
              <h3 className={styles.podiumRepoName}>
                <Link to={`/projects/${rank2.project}`}>{rank2.project}</Link>
              </h3>
              <div className={styles.podiumTags}>
                {rank2.language && <span className={styles.langPill}>{rank2.language}</span>}
                {rank2.stars && <span className={styles.starsPill}>⭐ {formatNumber(rank2.stars)}</span>}
              </div>
              <p className={styles.podiumDesc}>{rank2.description}</p>
              <div className={styles.podiumMeta}>
                <span>Grade {gradeFromScore(rank2.score).letter}</span>
                <span>·</span>
                <span>Pushed {rank2.last_analyzed}</span>
              </div>
              <Link to={`/projects/${rank2.project}`} className={styles.podiumCta}>
                Inspect Telemetry →
              </Link>
            </div>

            {/* Rank 1 (Gold) */}
            <div className={`${styles.podiumCard} ${styles.podiumGold}`}>
              <div className={styles.goldGlowEffect} />
              <div className={styles.podiumRankBadgeGold}>
                <span>👑 1st Rank Benchmark</span>
              </div>
              <div className={styles.podiumGauge}>
                <ScoreGauge score={rank1.score} size={130} />
              </div>
              <h3 className={styles.podiumRepoNameGold}>
                <Link to={`/projects/${rank1.project}`}>{rank1.project}</Link>
              </h3>
              <div className={styles.podiumTags}>
                {rank1.language && <span className={styles.langPillGold}>{rank1.language}</span>}
                {rank1.stars && <span className={styles.starsPillGold}>⭐ {formatNumber(rank1.stars)}</span>}
              </div>
              <p className={styles.podiumDesc}>{rank1.description}</p>
              <div className={styles.podiumMeta}>
                <span>Grade {gradeFromScore(rank1.score).letter}</span>
                <span>·</span>
                <span>Pushed {rank1.last_analyzed}</span>
              </div>
              <Link to={`/projects/${rank1.project}`} className={styles.podiumCtaGold}>
                Inspect Telemetry & Math →
              </Link>
            </div>

            {/* Rank 3 (Bronze) */}
            <div className={`${styles.podiumCard} ${styles.podiumBronze}`}>
              <div className={styles.podiumRankBadge}>
                <span>🥉 3rd Rank</span>
              </div>
              <div className={styles.podiumGauge}>
                <ScoreGauge score={rank3.score} size={110} />
              </div>
              <h3 className={styles.podiumRepoName}>
                <Link to={`/projects/${rank3.project}`}>{rank3.project}</Link>
              </h3>
              <div className={styles.podiumTags}>
                {rank3.language && <span className={styles.langPill}>{rank3.language}</span>}
                {rank3.stars && <span className={styles.starsPill}>⭐ {formatNumber(rank3.stars)}</span>}
              </div>
              <p className={styles.podiumDesc}>{rank3.description}</p>
              <div className={styles.podiumMeta}>
                <span>Grade {gradeFromScore(rank3.score).letter}</span>
                <span>·</span>
                <span>Pushed {rank3.last_analyzed}</span>
              </div>
              <Link to={`/projects/${rank3.project}`} className={styles.podiumCta}>
                Inspect Telemetry →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Rankings Table ── */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Connecting to real GitHub telemetry & calculating Vitality scores...</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <div className={styles.tableHeaderBar}>
            <span className={styles.resultsCount}>
              Showing <strong>{filteredAndSorted.length}</strong> of <strong>{items.length}</strong> real GitHub repositories
            </span>
            <span className={styles.tableHint}>
              Ranked by {sortBy === 'score' ? 'Vitality Health Algorithm (0–100)' : 'GitHub Stargazers Count'}
            </span>
          </div>

          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thRank}>Rank</th>
                  <th className={styles.thProject}>Repository & Details</th>
                  <th className={styles.thLanguage}>Language</th>
                  <th className={styles.thStars}>GitHub Stars</th>
                  <th className={styles.thScore}>Health Score</th>
                  <th className={styles.thGrade}>Grade</th>
                  <th className={styles.thUpdated}>Last Pushed</th>
                  <th className={styles.thAction}></th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((item, index) => {
                  const grade = gradeFromScore(item.score);
                  const effectiveRank = sortBy === 'score' ? item.rank : index + 1;
                  const isTop1 = effectiveRank === 1;
                  const isTop2 = effectiveRank === 2;
                  const isTop3 = effectiveRank === 3;

                  return (
                    <tr key={item.project} className={styles.row}>
                      {/* Rank */}
                      <td className={styles.tdRank}>
                        <div
                          className={`${styles.rankBadge} ${
                            isTop1
                              ? styles.rank1
                              : isTop2
                              ? styles.rank2
                              : isTop3
                              ? styles.rank3
                              : styles.rankStandard
                          }`}
                        >
                          {isTop1 ? '🥇 1' : isTop2 ? '🥈 2' : isTop3 ? '🥉 3' : `#${effectiveRank}`}
                        </div>
                      </td>

                      {/* Project Name & Description */}
                      <td className={styles.tdProject}>
                        <div className={styles.projectCell}>
                          <Link to={`/projects/${item.project}`} className={styles.projectLink}>
                            <span className={styles.projectIcon}>📦</span>
                            <span className={styles.projectName}>{item.project}</span>
                          </Link>
                          {item.description && (
                            <p className={styles.tableDesc}>{item.description}</p>
                          )}
                        </div>
                      </td>

                      {/* Language */}
                      <td className={styles.tdLanguage}>
                        {item.language ? (
                          <span className={styles.tableLangTag}>{item.language}</span>
                        ) : (
                          <span className={styles.tableMutedText}>—</span>
                        )}
                      </td>

                      {/* GitHub Stars */}
                      <td className={styles.tdStars}>
                        <div className={styles.starsWrapper}>
                          <span className={styles.starsIcon}>⭐</span>
                          <span className={styles.starsCount}>{formatNumber(item.stars)}</span>
                        </div>
                      </td>

                      {/* Score Bar */}
                      <td className={styles.tdScore}>
                        <div className={styles.scoreBarContainer}>
                          <div className={styles.scoreBarTrack}>
                            <div
                              className={styles.scoreBarFill}
                              style={{
                                width: `${item.score}%`,
                                background: getScoreTierGradient(item.score),
                              }}
                            />
                          </div>
                          <span className={styles.scoreNum} style={{ color: grade.color }}>
                            {item.score}
                          </span>
                        </div>
                      </td>

                      {/* Grade */}
                      <td className={styles.tdGrade}>
                        <span
                          className={styles.gradeBadge}
                          style={{
                            color: grade.color,
                            borderColor: `${grade.color}40`,
                            backgroundColor: `${grade.color}15`,
                          }}
                        >
                          {grade.letter}
                        </span>
                      </td>

                      {/* Last Pushed */}
                      <td className={styles.tdUpdated}>
                        <span className={styles.updatedText}>{item.last_analyzed}</span>
                      </td>

                      {/* Action */}
                      <td className={styles.tdAction}>
                        <Link to={`/projects/${item.project}`} className={styles.inspectBtn}>
                          <span>Inspect</span>
                          <span className={styles.arrow}>→</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredAndSorted.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔍</div>
              <h3>No matching repositories found</h3>
              <p>Try searching for a different keyword or resetting your filters.</p>
              <button
                type="button"
                className={styles.resetBtn}
                onClick={() => {
                  setFilter('');
                  setTierFilter('all');
                  setLangFilter('all');
                }}
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
