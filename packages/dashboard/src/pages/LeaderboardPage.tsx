import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchLeaderboard, type LeaderboardItem } from '../api.js';
import styles from './LeaderboardPage.module.css';

function gradeFromScore(score: number): { letter: string; colorClass: string } {
  if (score >= 95) return { letter: 'A+', colorClass: styles['gradeA'] ?? '' };
  if (score >= 90) return { letter: 'A', colorClass: styles['gradeA'] ?? '' };
  if (score >= 80) return { letter: 'B', colorClass: styles['gradeB'] ?? '' };
  if (score >= 70) return { letter: 'C', colorClass: styles['gradeC'] ?? '' };
  if (score >= 60) return { letter: 'D', colorClass: styles['gradeD'] ?? '' };
  return { letter: 'F', colorClass: styles['gradeF'] ?? '' };
}

export function LeaderboardPage() {
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchLeaderboard(1, 50)
      .then((res) => setItems(res.results))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((item) =>
    item.project.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Open Source Health Leaderboard</h1>
          <p className={styles.subtitle}>
            Continuous health telemetry rankings based on the Vitality v1.0.0 protocol.
          </p>
        </div>

        <div className={styles.filterWrapper}>
          <input
            type="text"
            className={styles.filterInput}
            placeholder="Filter projects..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </header>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading rankings...</p>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thRank}>Rank</th>
                <th className={styles.thProject}>Project</th>
                <th className={styles.thScore}>Score</th>
                <th className={styles.thGrade}>Grade</th>
                <th className={styles.thUpdated}>Last Audited</th>
                <th className={styles.thAction}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const grade = gradeFromScore(item.score);
                const isTop3 = item.rank <= 3;

                return (
                  <tr key={item.project} className={styles.row}>
                    <td className={styles.tdRank}>
                      <span
                        className={`${styles.rankBadge} ${
                          item.rank === 1
                            ? styles.rank1
                            : item.rank === 2
                            ? styles.rank2
                            : item.rank === 3
                            ? styles.rank3
                            : ''
                        }`}
                      >
                        {isTop3 ? ['🥇', '🥈', '🥉'][item.rank - 1] : `#${item.rank}`}
                      </span>
                    </td>
                    <td className={styles.tdProject}>
                      <Link to={`/projects/${item.project}`} className={styles.projectLink}>
                        {item.project}
                      </Link>
                    </td>
                    <td className={styles.tdScore}>
                      <div className={styles.scoreBarWrapper}>
                        <div className={styles.scoreBarTrack}>
                          <div
                            className={styles.scoreBarFill}
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                        <span className={styles.scoreNum}>{item.score}</span>
                      </div>
                    </td>
                    <td className={styles.tdGrade}>
                      <span className={`${styles.gradeBadge} ${grade.colorClass}`}>
                        {grade.letter}
                      </span>
                    </td>
                    <td className={styles.tdUpdated}>{item.last_analyzed}</td>
                    <td className={styles.tdAction}>
                      <Link to={`/projects/${item.project}`} className={styles.viewBtn}>
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className={styles.empty}>
              <p>No projects match "{filter}".</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
