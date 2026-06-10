-- ═══════════════════════════════════════════════════════════════════════════
--  BCEL Best Teller — score_point seed / update
--  Adds prod_code column and upserts all 30 product rows.
--  Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE score_point
  ADD COLUMN IF NOT EXISTS prod_code VARCHAR(50);

INSERT INTO score_point (prod_name, prod_code, score, is_active) VALUES
  ('TLR_CASHIN',           'C_CASH',     0,    true),
  ('DOMESTIC CARD',        'CUP',        2,    true),
  ('DOMESTIC CARD_VIRTUAL','CUP VIRTUAL',2,    true),
  ('INTERNATIONAL CARD',   'INTER CARD', 5,    true),
  ('PAYCARD',              'PAYCARD',    1,    true),
  ('BCELONE',              'B1',         5,    true),
  ('IBANK',                'IBANK',      4,    true),
  ('SMS',                  'SMS',        2,    true),
  ('ONEPAY',               'ONEPAY',     3,    true),
  ('UPI-REPLACE',          'ONEPAY RP',  1,    true),
  ('EDC',                  'EDC',        7,    true),
  ('ACCOUNT_OPENNING',     'AC_OPN',     3,    true),
  ('ACCOUNT_CLOSURE',      'AC_CLS',     2,    true),
  ('CASH_DEPOSIT',         'CASH DPS',   1,    true),
  ('CASH_WITHDRAWAL',      'CASH OUT',   1,    true),
  ('TELEGRAPHIC_TRANSFER', 'P',          0.5,  true),
  ('ACCOUNT_TRANSFER',     'P2P',        1,    true),
  ('SMARTVAT',             'SMVAT',      1,    true),
  ('DOMEST_FT',            'DOMES TRF',  2,    true),
  ('INTER_FT',             'INTER TRF',  5,    true),
  ('SALARY_UPLOAD',        'SAL',        0.06, true),
  ('CHEQUE',               'CHEQUE',     1.5,  true),
  ('EXCHANGE',             'EXCH',       2,    true),
  ('LOAN',                 'LOAN',       3,    true),
  ('CARDONE',              'C1_MG',      1,    true),
  ('CACISS',               'CASSIC MG',  3,    true),
  ('B1_MG',                'B1_MG',      1,    true),
  ('IBK_ACT',              'IB_MG',      3,    true),
  ('EXTRA_SCORE',          'ExtraScore', 3,    true),
  ('OTHER',                'OTH',        0.5,  true)
ON CONFLICT (prod_name) DO UPDATE SET
  prod_code  = EXCLUDED.prod_code,
  score      = EXCLUDED.score,
  is_active  = EXCLUDED.is_active,
  updated_at = NOW();
