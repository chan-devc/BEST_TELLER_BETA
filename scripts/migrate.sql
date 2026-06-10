-- ═══════════════════════════════════════════════════════
--  BCEL Best Teller Award — PostgreSQL Schema
--  Database: RewardTeller
--  Run this first, then migrate_data_source.sql.
-- ═══════════════════════════════════════════════════════

-- ── Auto-update updated_at trigger function ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 1. Admin Users ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name  VARCHAR(100) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'editor'
                  CHECK (role IN ('superadmin', 'editor')),
  color         VARCHAR(20)  NOT NULL DEFAULT '#C8001E',
  is_active     BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active   BOOLEAN     NOT NULL DEFAULT true;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS color       VARCHAR(20) NOT NULL DEFAULT '#C8001E';

DO $$ BEGIN
  CREATE TRIGGER trg_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. Categories (sheet definitions) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL PRIMARY KEY,
  sheet_key  VARCHAR(50)  NOT NULL UNIQUE,
  cat        VARCHAR(20)  NOT NULL,
  type       VARCHAR(30)  NOT NULL,
  label      VARCHAR(150) NOT NULL,
  emoji      VARCHAR(10)  NOT NULL DEFAULT '📊',
  sort_order INTEGER      NOT NULL DEFAULT 0,
  is_public  BOOLEAN      NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

-- ── 3. Tellers ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tellers (
  id               SERIAL PRIMARY KEY,
  user_code        VARCHAR(20)  NOT NULL,
  name             VARCHAR(150) NOT NULL,
  position         VARCHAR(100),
  unit             VARCHAR(200),
  branch           VARCHAR(200),
  score            NUMERIC(6,2) NOT NULL DEFAULT 0,
  rank_in_category INTEGER      NOT NULL DEFAULT 0,
  category_id      INTEGER      NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  is_active        BOOLEAN      NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_code, category_id)
);
ALTER TABLE tellers ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_tellers_category_id ON tellers(category_id);
CREATE INDEX IF NOT EXISTS idx_tellers_score       ON tellers(score DESC);
CREATE INDEX IF NOT EXISTS idx_tellers_user_code   ON tellers(user_code);

DO $$ BEGIN
  CREATE TRIGGER trg_tellers_updated_at
    BEFORE UPDATE ON tellers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 4. Announcements ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id          SERIAL PRIMARY KEY,
  title_lo    VARCHAR(300) NOT NULL,
  title_en    VARCHAR(300),
  body        TEXT,
  status      VARCHAR(20)  NOT NULL DEFAULT 'draft'
                CHECK (status IN ('live', 'draft', 'scheduled')),
  tag         VARCHAR(20)  NOT NULL DEFAULT 'new'
                CHECK (tag IN ('new', 'perf', 'event', 'q1')),
  role_target VARCHAR(20)  NOT NULL DEFAULT 'all'
                CHECK (role_target IN ('all', 'admin')),
  created_by  INTEGER      REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER trg_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 5. Best Teller Approval History ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS best_teller_approvals (
  id          SERIAL PRIMARY KEY,
  issue_date  INTEGER      NOT NULL,
  note        TEXT,
  approved_by INTEGER      REFERENCES admin_users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bta_issue_date ON best_teller_approvals(issue_date);
CREATE INDEX IF NOT EXISTS idx_bta_approved_at ON best_teller_approvals(approved_at DESC);

-- ── 6. Upload History ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS upload_history (
  id            SERIAL PRIMARY KEY,
  filename      VARCHAR(255) NOT NULL,
  records_count INTEGER      NOT NULL DEFAULT 0,
  status        VARCHAR(20)  NOT NULL DEFAULT 'success'
                  CHECK (status IN ('success', 'error')),
  error_message TEXT,
  uploaded_by   INTEGER      REFERENCES admin_users(id) ON DELETE SET NULL,
  sheet_results JSONB,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
ALTER TABLE upload_history ADD COLUMN IF NOT EXISTS sheet_results JSONB;

-- ── 6. App Settings ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_settings (
  key        VARCHAR(100) PRIMARY KEY,
  value      TEXT         NOT NULL,
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO app_settings (key, value) VALUES
  ('public_site_enabled',    'true'),
  ('notifications_enabled',  'true')
ON CONFLICT (key) DO NOTHING;
