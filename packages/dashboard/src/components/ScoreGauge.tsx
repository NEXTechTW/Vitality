import styles from './ScoreGauge.module.css';

interface Props {
  score: number;
  size?: number;
}

function scoreClass(score: number): string {
  if (score >= 90) return 'great';
  if (score >= 75) return 'good';
  if (score >= 60) return 'ok';
  if (score >= 40) return 'warn';
  return 'bad';
}

function grade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C+';
  if (score >= 50) return 'C';
  return 'D';
}

function scoreColor(score: number): string {
  if (score >= 90) return 'var(--score-great)';
  if (score >= 75) return 'var(--score-good)';
  if (score >= 60) return 'var(--score-ok)';
  if (score >= 40) return 'var(--score-warn)';
  return 'var(--score-bad)';
}

export function ScoreGauge({ score, size = 180 }: Props) {
  const radius = (size - 24) / 2;
  const circumference = Math.PI * radius; // half circle
  const progress = (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div className={styles.wrapper} style={{ width: size, height: size / 2 + 40 }}>
      <svg
        width={size}
        height={size / 2 + 8}
        viewBox={`0 0 ${size} ${size / 2 + 8}`}
        className={styles.svg}
        aria-label={`Health score: ${score} out of 100`}
        role="img"
      >
        {/* Track */}
        <path
          d={describeArc(size / 2, size / 2, radius, -180, 0)}
          fill="none"
          stroke="var(--bg-elevated)"
          strokeWidth={10}
          strokeLinecap="round"
        />
        {/* Progress */}
        <path
          d={describeArc(size / 2, size / 2, radius, -180, 0)}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          className={styles.progress}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>

      <div className={styles.scoreText}>
        <span className={styles.scoreNumber} style={{ color }}>{score}</span>
        <span className={styles.scoreMax}>/100</span>
      </div>
      <div className={`badge badge-${scoreClass(score)} ${styles.grade}`}>
        {grade(score)}
      </div>
    </div>
  );
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = polarToCartesian(cx, cy, r, endDeg);
  const end = polarToCartesian(cx, cy, r, startDeg);
  return `M ${start.x} ${start.y} A ${r} ${r} 0 1 0 ${end.x} ${end.y}`;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angle = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}
