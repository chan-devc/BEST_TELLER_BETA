-- ═══════════════════════════════════════════════════════
--  BCEL Best Teller — Data Source Tables
--  Rebuilt from master_data_source.xlsx
--  Run after migrate.sql.
-- ═══════════════════════════════════════════════════════

-- ── Drop all old per-dept views first ─────────────────────────────────────────


-- ── Drop old tables ────────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS source_saft_teller             CASCADE;
-- DROP TABLE IF EXISTS source_position                CASCADE;
-- DROP TABLE IF EXISTS source_sector                  CASCADE;
-- DROP TABLE IF EXISTS source_group_rank              CASCADE;
-- DROP TABLE IF EXISTS join_grouprank_department      CASCADE;
-- DROP TABLE IF EXISTS master_teller                  CASCADE;
-- DROP TABLE IF EXISTS master_sector                  CASCADE;
-- DROP TABLE IF EXISTS master_rank                    CASCADE;
-- DROP TABLE IF EXISTS rank_department                CASCADE;

-- ── 1. department ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS department (
  id          SERIAL PRIMARY KEY,
  department  VARCHAR(200),
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── 2. source_position (sheet: position) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS source_position (
  id            SERIAL PRIMARY KEY,
  position_name VARCHAR(200),
  level         VARCHAR(50),
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. master_sector ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS master_sector (
  no              SERIAL PRIMARY KEY,
  sector_name     VARCHAR(200),
  department_code INTEGER,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. master_rank ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS master_rank (
  id         SERIAL PRIMARY KEY,
  group_name VARCHAR(200),
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. master_teller ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS master_teller (
  user_code       VARCHAR(20) PRIMARY KEY,
  finger_code     VARCHAR(20),
  fullname        VARCHAR(200),
  description     TEXT,
  position_code   INTEGER,
  sector_code     INTEGER,
  department_code INTEGER,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. rank_department ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rank_department (
  id            SERIAL PRIMARY KEY,
  group_id      INTEGER,
  department_id INTEGER,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, department_id)
);

-- ── 7. source_txn ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS source_txn (
  id              SERIAL PRIMARY KEY,
  user_id         VARCHAR(50),
  issue_date      VARCHAR(7),
  dys             INTEGER       DEFAULT 0,
  total           INTEGER       DEFAULT 0,
  product_name    VARCHAR(200),
  amt             NUMERIC(20,4) DEFAULT 0,
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_source_txn_user_period_prod UNIQUE (user_id, issue_date, product_name)
);

-- ── 8. source_bcelone_approved_duplica ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS source_bcelone_approved_duplica (
  id                  SERIAL PRIMARY KEY,
  user_code           VARCHAR(20),
  issue_date          VARCHAR(7),
  total_approved      INTEGER     DEFAULT 0,
  duplicate_approved  VARCHAR(50),
  is_active           BOOLEAN     NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_source_bcelone_user_period UNIQUE (user_code, issue_date)
);

-- ── 9. source_teller_reverse ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS source_teller_reverse (
  id              SERIAL PRIMARY KEY,
  user_code       VARCHAR(20),
  issue_date      VARCHAR(7),
  reverse_counts  INTEGER     DEFAULT 0,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_source_teller_reverse_user_period UNIQUE (user_code, issue_date)
);


-- ── 10. source_teller_recor ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS source_teller_recor (
  id           SERIAL PRIMARY KEY,
  user_code    VARCHAR(20),
  issue_date   VARCHAR(7),
  recor_count  INTEGER     DEFAULT 0,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_teller_recor_user_period UNIQUE (user_code, issue_date)
);




-- ── 11. attendent ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendent (
  id               SERIAL PRIMARY KEY,
  user_code        VARCHAR(20),
  issue_date       VARCHAR(7),
  days_present     INTEGER     DEFAULT 0,
  days_on_time     INTEGER     DEFAULT 0,
  days_late        INTEGER     DEFAULT 0,
  days_early_leave INTEGER     DEFAULT 0,
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_attendent_user_period UNIQUE (user_code, issue_date)
);



-- ── 12. score_point ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS score_point (
  id         SERIAL PRIMARY KEY,
  prod_name  VARCHAR(50)  UNIQUE,
  score      NUMERIC(8,4) DEFAULT 0,
  is_active  BOOLEAN      NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── 13. mst_weighted_score ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mst_weighted_score (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(50),
  score      NUMERIC(8,2) DEFAULT 0,
  is_active  BOOLEAN      NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── 14. mst_special_score ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mst_special_score (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(200),
  score      NUMERIC(8,2) DEFAULT 0,
  is_active  BOOLEAN      NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── 15. discipline_percented ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS discipline_percented (
  id         SERIAL PRIMARY KEY,
  percented  NUMERIC(8,4) DEFAULT 0,
  score      NUMERIC(8,2) DEFAULT 0,
  is_active  BOOLEAN      NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

