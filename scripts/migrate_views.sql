-- ═══════════════════════════════════════════════════════════════════════════
--  BCEL Best Teller — view_teller_score
--  Works with the new product-based source_txn schema:
--    source_txn(user_id, issue_date, dys, product_name, amt)
--  Joins directly with score_point on product_name — no column unpivoting.
--  Safe to re-run (DROP + CREATE).
--
--  issue_date is VARCHAR(7) "YYYY-MM" in all tables.
--  app_settings.approved_issue_date stores INTEGER (e.g. 202601) and is
--  converted to "YYYY-MM" inside active_period.
-- ═══════════════════════════════════════════════════════════════════════════

DROP VIEW IF EXISTS view_teller_score CASCADE;

CREATE VIEW view_teller_score AS
WITH
active_period AS (
  SELECT COALESCE(
    (SELECT LPAD((value::integer / 100)::text, 4, '0')
            || '-' ||
            LPAD((value::integer % 100)::text, 2, '0')
     FROM app_settings WHERE key = 'approved_issue_date' LIMIT 1),
    (SELECT MAX(issue_date) FROM source_txn WHERE is_active = true AND issue_date IS NOT NULL)
  ) AS issue_date
),
filtered_txn AS (
  SELECT t.*
  FROM source_txn t, active_period p
  WHERE t.is_active = true
    AND t.user_id ~ '^BCEL[0-9]+$'
    AND t.product_name IS NOT NULL
    AND (p.issue_date IS NULL OR t.issue_date = p.issue_date)
)
SELECT
  t.user_id,
  COALESCE(mt.fullname, t.user_id)              AS user_name,
  t.issue_date,
  t.product_name                                AS prod_name,
  COALESCE(t.amt, 0)                            AS cnt,
  COALESCE(sp.score, 0)                         AS score,
  COALESCE(t.amt, 0) * COALESCE(sp.score, 0)   AS points
FROM filtered_txn t
LEFT JOIN master_teller mt ON mt.user_code = t.user_id
LEFT JOIN score_point   sp ON sp.prod_name = t.product_name AND sp.is_active = true;
