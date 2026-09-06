import React, { useState } from 'react';
import styles from './BreakdownPanel.module.css';

interface BreakdownItem {
  label: string;
  delta: number;
}

interface DimensionProps {
  title: string;
  icon: string;
  score: number;
  breakdown: BreakdownItem[];
  metrics?: { label: string; value: string | number }[];
}

export function BreakdownPanel({
  dimensions,
}: {
  dimensions: DimensionProps[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex((curr) => (curr === idx ? null : idx));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Scoring Mechanics & Explainability</h3>
          <p className={styles.subtitle}>
            Every point added or deducted is backed by verifiable on-chain GitHub and OSV metrics.
          </p>
        </div>
        <span className={styles.badge}>
          <span className={styles.badgeDot} />
          Deterministic · 0 Hallucinations
        </span>
      </div>

      <div className={styles.accordion}>
        {dimensions.map((dim, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={dim.title} className={`${styles.item} ${isOpen ? styles.open : ''}`}>
              <button
                type="button"
                className={styles.trigger}
                onClick={() => toggle(idx)}
                aria-expanded={isOpen}
              >
                <div className={styles.dimInfo}>
                  <span className={styles.icon}>{dim.icon}</span>
                  <span className={styles.dimTitle}>{dim.title}</span>
                </div>
                <div className={styles.dimRight}>
                  <span className={styles.scoreText}>{dim.score} / 100</span>
                  <span className={`${styles.chevron} ${isOpen ? styles.rotated : ''}`}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </div>
              </button>

              <div className={`${styles.contentWrapper} ${isOpen ? styles.contentOpen : ''}`}>
                <div className={styles.content}>
                  {dim.metrics && dim.metrics.length > 0 && (
                    <div className={styles.metricsGrid}>
                      {dim.metrics.map((m) => (
                        <div key={m.label} className={styles.metricCard}>
                          <span className={styles.metricLabel}>{m.label}</span>
                          <span className={styles.metricVal}>{m.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={styles.breakdownList}>
                    <div className={styles.listHeader}>Factor Contributions:</div>
                    {dim.breakdown.map((item, i) => {
                      const isPositive = item.delta >= 0;
                      const absDelta = Math.abs(item.delta);
                      return (
                        <div key={i} className={styles.factorRow}>
                          <div className={styles.factorLeft}>
                            <div
                              className={`${styles.factorBar} ${isPositive ? styles.barPositive : styles.barNegative}`}
                              style={{ width: `${Math.min(absDelta * 2.5, 100)}%` }}
                            />
                            <span className={styles.factorLabel}>{item.label}</span>
                          </div>
                          <span
                            className={`${styles.factorDelta} ${
                              isPositive ? styles.positive : styles.negative
                            }`}
                          >
                            {isPositive ? `+${item.delta}` : item.delta} pts
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
