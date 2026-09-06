import styles from './DimensionBar.module.css';
import clsx from 'clsx';

interface Props {
  label: string;
  score: number;
  icon: string;
}

function scoreClass(score: number): string {
  if (score >= 90) return 'great';
  if (score >= 75) return 'good';
  if (score >= 60) return 'ok';
  if (score >= 40) return 'warn';
  return 'bad';
}

function scoreColor(score: number): string {
  if (score >= 90) return '#22c55e';
  if (score >= 75) return '#84cc16';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

export function DimensionBar({ label, score, icon }: Props) {
  const cls = scoreClass(score);
  const color = scoreColor(score);

  return (
    <div className={styles.row}>
      <div className={styles.labelRow}>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.label}>{label}</span>
        <span className={clsx(styles.score, `score-${cls}`)}>{score}</span>
      </div>
      <div className={styles.track} role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={styles.fill}
          style={{
            '--target-width': `${score}%`,
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            boxShadow: `0 0 12px ${color}40`,
          } as React.CSSProperties}
        />
        {/* Shimmer overlay */}
        <div className={styles.shimmer} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
