-- =============================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- Fixes missing columns that cause 400 errors
-- =============================================

-- 1. Add guarantee_amount to payments if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'guarantee_amount'
  ) THEN
    ALTER TABLE payments ADD COLUMN guarantee_amount numeric DEFAULT 0;
    RAISE NOTICE 'Added guarantee_amount to payments';
  ELSE
    RAISE NOTICE 'guarantee_amount already exists';
  END IF;
END $$;

-- 2. Add deposit_amount to payments if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'deposit_amount'
  ) THEN
    ALTER TABLE payments ADD COLUMN deposit_amount numeric DEFAULT 0;
    RAISE NOTICE 'Added deposit_amount to payments';
  ELSE
    RAISE NOTICE 'deposit_amount already exists';
  END IF;
END $$;

-- 3. Add mission_completion_date to payments if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'mission_completion_date'
  ) THEN
    ALTER TABLE payments ADD COLUMN mission_completion_date timestamptz;
    RAISE NOTICE 'Added mission_completion_date to payments';
  ELSE
    RAISE NOTICE 'mission_completion_date already exists';
  END IF;
END $$;

-- 4. Add client_user_id to contracts if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'client_user_id'
  ) THEN
    ALTER TABLE contracts ADD COLUMN client_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_contracts_client_user_id ON contracts(client_user_id);
    RAISE NOTICE 'Added client_user_id to contracts';
  ELSE
    RAISE NOTICE 'client_user_id already exists';
  END IF;
END $$;

-- 5. Add sent_to_client/mover columns to contracts if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'sent_to_client'
  ) THEN
    ALTER TABLE contracts ADD COLUMN sent_to_client boolean DEFAULT false;
    ALTER TABLE contracts ADD COLUMN sent_to_client_at timestamptz;
    ALTER TABLE contracts ADD COLUMN sent_to_mover boolean DEFAULT false;
    ALTER TABLE contracts ADD COLUMN sent_to_mover_at timestamptz;
    RAISE NOTICE 'Added sent_to columns to contracts';
  ELSE
    RAISE NOTICE 'sent_to columns already exist';
  END IF;
END $$;

-- Done!
SELECT 'Migration completed successfully' as result;
