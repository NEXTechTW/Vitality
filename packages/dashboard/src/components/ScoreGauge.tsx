import { useEffect, useRef, useState } from 'react';
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
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C+';
  if (score >= 50) return 'C';
  return 'D';
}

function scoreColor(score: number): string {
  if (score >= 90) return '#22c55e';
  if (score >= 75) return '#84cc16';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

export function ScoreGauge({ score, size = 180 }: Props) {
  const strokeWidth = Math.max(8, size * 0.055);
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (score / 100) * circumference;
  const color = scoreColor(score);
  const cls = scoreClass(score);

  // Animated counter
  const [displayScore, setDisplayScore] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayScore(Math.round(eased * score));
      if (t < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [score]);

  return (
    <div className={styles.wrapper} style={{ width: size, height: size }}>
      {/* Ambient glow behind the ring */}
      <div
        className={styles.glow}
        style={{
          background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
        }}
      />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={styles.svg}
        aria-label={`Health score: ${score} out of 100`}
        role="img"
      >
        {/* Background track ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={strokeWidth}
        />
        {/* Subtle tick marks */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.02)"
          strokeWidth={strokeWidth + 4}
          strokeDasharray={`1 ${(circumference - 100) / 100}`}
        />
        {/* Animated progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          className={styles.progressRing}
          style={{
            '--circumference': `${circumference}`,
            filter: `drop-shadow(0 0 6px ${color}80)`,
            transformOrigin: '50% 50%',
            transform: 'rotate(-90deg)',
          } as React.CSSProperties}
        />
      </svg>

      {/* Center score display */}
      <div className={styles.center}>
        <span className={styles.scoreNumber} style={{ color }}>
          {displayScore}
        </span>
        <span className={styles.scoreMax}>/100</span>
      </div>

      {/* Grade badge */}
      <div className={`${styles.gradeBadge} ${styles[`grade_${cls}`] ?? ''}`}>
        {grade(score)}
      </div>
    </div>
  );
}
