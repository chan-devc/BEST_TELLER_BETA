-- Performance indexes for common query patterns
-- Safe to re-run: all use IF NOT EXISTS / CREATE INDEX CONCURRENTLY equivalent

-- source_txn: most-queried table (rank, teller-score, winners)
CREATE INDEX IF NOT EXISTS idx_source_txn_issue_active    ON source_txn (issue_date, is_active);
CREATE INDEX IF NOT EXISTS idx_source_txn_user_issue      ON source_txn (user_id, issue_date) WHERE is_active = true;

-- source_teller_reverse / recor
CREATE INDEX IF NOT EXISTS idx_str_user_issue             ON source_teller_reverse (user_code, issue_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_stc_user_issue             ON source_teller_recor   (user_code, issue_date) WHERE is_active = true;

-- attendent
CREATE INDEX IF NOT EXISTS idx_attendent_user_issue       ON attendent (user_code, issue_date) WHERE is_active = true;

-- master_teller: filters on is_active + department_code
CREATE INDEX IF NOT EXISTS idx_master_teller_active_dept  ON master_teller (is_active, department_code);

-- rank_department: FK lookups
CREATE INDEX IF NOT EXISTS idx_rank_dept_group            ON rank_department (group_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_rank_dept_dept             ON rank_department (department_id) WHERE is_active = true;

-- discipline_percented: LATERAL lookups sorted by percented DESC
CREATE INDEX IF NOT EXISTS idx_disc_pct_active_pct        ON discipline_percented (percented DESC) WHERE is_active = true;

-- score_point: single-column lookup by prod_name
CREATE INDEX IF NOT EXISTS idx_score_point_prod           ON score_point (prod_name) WHERE is_active = true;

-- upload_history: dashboard recent uploads
CREATE INDEX IF NOT EXISTS idx_upload_history_created     ON upload_history (created_at DESC);

-- best_teller_approvals: dashboard recent approvals
CREATE INDEX IF NOT EXISTS idx_approvals_at               ON best_teller_approvals (approved_at DESC);

-- app_settings: key lookup
CREATE INDEX IF NOT EXISTS idx_app_settings_key           ON app_settings (key);
