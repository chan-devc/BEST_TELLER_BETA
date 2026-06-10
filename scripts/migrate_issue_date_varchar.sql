-- Change issue_date from INTEGER to VARCHAR("YYYY-MM") in CSV-imported tables.
-- Safe to re-run: skips if column is already VARCHAR.
-- source_txn.issue_date remains INTEGER (imported from XLSX monthly file).

DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name='attendent' AND column_name='issue_date') = 'integer' THEN
    ALTER TABLE attendent ALTER COLUMN issue_date TYPE VARCHAR(7)
    USING CASE WHEN issue_date IS NULL THEN NULL
               ELSE LPAD((issue_date/100)::text,4,'0')||'-'||LPAD((issue_date%100)::text,2,'0') END;
  END IF;
END $$;

DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name='source_teller_reverse' AND column_name='issue_date') = 'integer' THEN
    ALTER TABLE source_teller_reverse ALTER COLUMN issue_date TYPE VARCHAR(7)
    USING CASE WHEN issue_date IS NULL THEN NULL
               ELSE LPAD((issue_date/100)::text,4,'0')||'-'||LPAD((issue_date%100)::text,2,'0') END;
  END IF;
END $$;

DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name='source_teller_recor' AND column_name='issue_date') = 'integer' THEN
    ALTER TABLE source_teller_recor ALTER COLUMN issue_date TYPE VARCHAR(7)
    USING CASE WHEN issue_date IS NULL THEN NULL
               ELSE LPAD((issue_date/100)::text,4,'0')||'-'||LPAD((issue_date%100)::text,2,'0') END;
  END IF;
END $$;

DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name='source_bcelone_approved_duplica' AND column_name='issue_date') = 'integer' THEN
    ALTER TABLE source_bcelone_approved_duplica ALTER COLUMN issue_date TYPE VARCHAR(7)
    USING CASE WHEN issue_date IS NULL THEN NULL
               ELSE LPAD((issue_date/100)::text,4,'0')||'-'||LPAD((issue_date%100)::text,2,'0') END;
  END IF;
END $$;

-- Add UNIQUE constraint on score_point.prod_name if missing (required for ON CONFLICT upsert).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'score_point'::regclass AND contype = 'u'
      AND conname = 'score_point_prod_name_key'
  ) THEN
    ALTER TABLE score_point ADD CONSTRAINT score_point_prod_name_key UNIQUE (prod_name);
  END IF;
END $$;

-- Add UNIQUE constraint on rank_department(group_id, department_id) if missing.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'rank_department'::regclass AND contype = 'u'
      AND conname = 'rank_department_group_id_department_id_key'
  ) THEN
    ALTER TABLE rank_department ADD CONSTRAINT rank_department_group_id_department_id_key UNIQUE (group_id, department_id);
  END IF;
END $$;

-- Add UNIQUE constraint on attendent(user_code, issue_date) if missing (required for ON CONFLICT upsert).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'attendent'::regclass AND contype = 'u'
      AND conname = 'uq_attendent_user_period'
  ) THEN
    ALTER TABLE attendent ADD CONSTRAINT uq_attendent_user_period UNIQUE (user_code, issue_date);
  END IF;
END $$;

-- Add UNIQUE constraint on source_bcelone_approved_duplica(user_code, issue_date) if missing.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'source_bcelone_approved_duplica'::regclass AND contype = 'u'
      AND conname = 'uq_source_bcelone_user_period'
  ) THEN
    ALTER TABLE source_bcelone_approved_duplica ADD CONSTRAINT uq_source_bcelone_user_period UNIQUE (user_code, issue_date);
  END IF;
END $$;

-- Add UNIQUE constraint on source_teller_recor(user_code, issue_date) if missing.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'source_teller_recor'::regclass AND contype = 'u'
      AND conname = 'uq_teller_recor_user_period'
  ) THEN
    ALTER TABLE source_teller_recor ADD CONSTRAINT uq_teller_recor_user_period UNIQUE (user_code, issue_date);
  END IF;
END $$;

-- Add UNIQUE constraint on source_teller_reverse(user_code, issue_date) if missing.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'source_teller_reverse'::regclass AND contype = 'u'
      AND conname = 'uq_source_teller_reverse_user_period'
  ) THEN
    ALTER TABLE source_teller_reverse ADD CONSTRAINT uq_source_teller_reverse_user_period UNIQUE (user_code, issue_date);
  END IF;
END $$;

-- Add UNIQUE constraint on source_txn(user_id, issue_date, product_name) if missing.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'source_txn'::regclass AND contype = 'u'
      AND conname = 'uq_source_txn_user_period_prod'
  ) THEN
    ALTER TABLE source_txn ADD CONSTRAINT uq_source_txn_user_period_prod UNIQUE (user_id, issue_date, product_name);
  END IF;
END $$;

-- Change source_txn.amt from INTEGER to NUMERIC(20,4) — values can exceed integer range (billions with decimals).
DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name = 'source_txn' AND column_name = 'amt') = 'integer' THEN
    ALTER TABLE source_txn ALTER COLUMN amt TYPE NUMERIC(20,4);
  END IF;
END $$;

-- Change source_txn.issue_date from INTEGER to VARCHAR(7) "YYYY-MM".
DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name = 'source_txn' AND column_name = 'issue_date') = 'integer' THEN
    ALTER TABLE source_txn ALTER COLUMN issue_date TYPE VARCHAR(7)
    USING CASE WHEN issue_date IS NULL THEN NULL
               ELSE LPAD((issue_date/100)::text,4,'0')||'-'||LPAD((issue_date%100)::text,2,'0') END;
  END IF;
END $$;
