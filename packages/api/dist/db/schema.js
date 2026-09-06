/**
 * Database schema and migration for Vitality API.
 * Uses raw postgres (no ORM) for simplicity and performance.
 */
export const CREATE_TABLES_SQL = `
-- Append-only snapshots — scores are NEVER overwritten
CREATE TABLE IF NOT EXISTS snapshots (
  id          BIGSERIAL PRIMARY KEY,
  owner       TEXT        NOT NULL,
  repo        TEXT        NOT NULL,
  score       INTEGER     NOT NULL CHECK (score BETWEEN 0 AND 100),
  report      JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_repo ON snapshots (owner, repo, created_at DESC);

-- Latest snapshot per repo (materialized for fast badge/API reads)
CREATE TABLE IF NOT EXISTS latest_snapshots (
  owner           TEXT    NOT NULL,
  repo            TEXT    NOT NULL,
  snapshot_id     BIGINT  NOT NULL REFERENCES snapshots(id),
  score           INTEGER NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner, repo)
);

-- Analysis job queue (simple pg-based queue, no separate broker needed for MVP)
CREATE TABLE IF NOT EXISTS analysis_jobs (
  id          BIGSERIAL PRIMARY KEY,
  owner       TEXT        NOT NULL,
  repo        TEXT        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','done','failed')),
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at  TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_jobs_pending ON analysis_jobs (status, created_at)
  WHERE status = 'pending';
`;
//# sourceMappingURL=schema.js.map