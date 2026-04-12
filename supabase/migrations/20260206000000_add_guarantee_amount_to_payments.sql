-- Add guarantee_amount column to payments table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'guarantee_amount'
  ) THEN
    ALTER TABLE payments ADD COLUMN guarantee_amount numeric DEFAULT 0;
  END IF;
END $$;

-- Add deposit_amount column if it doesn't exist (some older payments might lack it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'deposit_amount'
  ) THEN
    ALTER TABLE payments ADD COLUMN deposit_amount numeric DEFAULT 0;
  END IF;
END $$;

-- Add mission_completion_date column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'mission_completion_date'
  ) THEN
    ALTER TABLE payments ADD COLUMN mission_completion_date timestamptz;
  END IF;
END $$;

-- Add client_user_id to contracts table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'client_user_id'
  ) THEN
    ALTER TABLE contracts ADD COLUMN client_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_contracts_client_user_id ON contracts(client_user_id);
  END IF;
END $$;

-- Add sent_to_client columns to contracts if missing
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
  END IF;
END $$;
