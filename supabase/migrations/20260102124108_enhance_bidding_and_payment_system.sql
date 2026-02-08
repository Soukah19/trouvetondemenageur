/*
  # Enhance Bidding and Payment System

  1. Updates to Existing Tables
    - `quotes` table - Add market price calculation and color indicator fields
      - `client_display_price` (numeric) - Price shown to client (+30%)
      - `market_price_estimate` (numeric) - AI calculated market price
      - `price_indicator` (text) - Color indicator: 'green', 'orange', 'red'
      - `notes` (text) - Optional notes from mover
      - `updated_at` (timestamptz)

    - `quote_requests` - Add payment tracking fields
      - `accepted_quote_id` (uuid) - Reference to accepted quote
      - `payment_status` (text) - Payment tracking

    - `movers` - Add contract tracking fields
      - `contract_signed` (boolean)
      - `contract_signed_at` (timestamptz)

  2. New Tables
    - `payments`
      - `id` (uuid, primary key)
      - `quote_request_id` (uuid, foreign key)
      - `quote_id` (uuid, foreign key)
      - `client_id` (uuid, foreign key to auth.users)
      - `mover_id` (uuid, foreign key to movers)
      - `total_amount` (numeric) - Total amount displayed to client
      - `amount_paid` (numeric) - 40% of total amount
      - `platform_fee` (numeric) - 30% of amount_paid
      - `mover_deposit` (numeric) - 10% of amount_paid
      - `remaining_amount` (numeric) - 60% to pay at delivery
      - `payment_status` (text)
      - `stripe_payment_id` (text)
      - `deposit_released` (boolean)
      - `deposit_release_date` (timestamptz)
      - `paid_at` (timestamptz)

    - `cancellations`
      - `id` (uuid, primary key)
      - `quote_request_id` (uuid, foreign key)
      - `payment_id` (uuid, foreign key)
      - `cancelled_by` (text) - 'client' or 'mover'
      - `cancelled_by_user_id` (uuid)
      - `cancellation_date` (timestamptz)
      - `moving_date` (date)
      - `days_before_moving` (integer)
      - `refund_percentage` (numeric) - 0, 50, or 100
      - `refund_amount` (numeric)
      - `refund_status` (text)
      - `reason` (text)

    - `admins`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `email` (text)
      - `role` (text) - 'super_admin', 'admin', 'support'
      - `permissions` (jsonb)

  3. Security
    - Enable RLS on all new tables
    - Update policies for privacy requirements
    - Movers can see all quote requests but not client contact info until payment
    - Clients can see bids but not mover contact info until payment
*/

-- Add columns to quotes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotes' AND column_name = 'client_display_price'
  ) THEN
    ALTER TABLE quotes ADD COLUMN client_display_price numeric CHECK (client_display_price > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotes' AND column_name = 'market_price_estimate'
  ) THEN
    ALTER TABLE quotes ADD COLUMN market_price_estimate numeric CHECK (market_price_estimate > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotes' AND column_name = 'price_indicator'
  ) THEN
    ALTER TABLE quotes ADD COLUMN price_indicator text CHECK (price_indicator IN ('green', 'orange', 'red'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotes' AND column_name = 'notes'
  ) THEN
    ALTER TABLE quotes ADD COLUMN notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotes' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE quotes ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Add columns to quote_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quote_requests' AND column_name = 'accepted_quote_id'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN accepted_quote_id uuid REFERENCES quotes(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quote_requests' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN payment_status text DEFAULT 'no_payment' CHECK (payment_status IN ('no_payment', 'deposit_paid', 'fully_paid', 'refunded'));
  END IF;
END $$;

-- Add columns to movers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movers' AND column_name = 'contract_signed'
  ) THEN
    ALTER TABLE movers ADD COLUMN contract_signed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movers' AND column_name = 'contract_signed_at'
  ) THEN
    ALTER TABLE movers ADD COLUMN contract_signed_at timestamptz;
  END IF;
END $$;

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid REFERENCES quote_requests(id) ON DELETE CASCADE NOT NULL,
  quote_id uuid REFERENCES quotes(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mover_id uuid REFERENCES movers(id) ON DELETE CASCADE NOT NULL,
  total_amount numeric NOT NULL CHECK (total_amount > 0),
  amount_paid numeric NOT NULL CHECK (amount_paid > 0),
  platform_fee numeric NOT NULL CHECK (platform_fee >= 0),
  mover_deposit numeric NOT NULL CHECK (mover_deposit >= 0),
  remaining_amount numeric NOT NULL CHECK (remaining_amount >= 0),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'refunded_full', 'refunded_partial')),
  stripe_payment_id text,
  deposit_released boolean DEFAULT false,
  deposit_release_date timestamptz,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create cancellations table
CREATE TABLE IF NOT EXISTS cancellations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid REFERENCES quote_requests(id) ON DELETE CASCADE NOT NULL,
  payment_id uuid REFERENCES payments(id) ON DELETE CASCADE,
  cancelled_by text NOT NULL CHECK (cancelled_by IN ('client', 'mover')),
  cancelled_by_user_id uuid NOT NULL,
  cancellation_date timestamptz DEFAULT now(),
  moving_date date NOT NULL,
  days_before_moving integer NOT NULL,
  refund_percentage numeric NOT NULL CHECK (refund_percentage IN (0, 50, 100)),
  refund_amount numeric NOT NULL CHECK (refund_amount >= 0),
  refund_status text NOT NULL DEFAULT 'pending' CHECK (refund_status IN ('pending', 'completed', 'failed')),
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'support')),
  permissions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments

-- Clients can view their own payments
CREATE POLICY "Clients can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

-- Movers can view payments for their quotes
CREATE POLICY "Movers can view payments for own quotes"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = mover_id
      AND movers.user_id = auth.uid()
    )
  );

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Admins can manage payments
CREATE POLICY "Admins can manage payments"
  ON payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- RLS Policies for cancellations

-- Users can view cancellations they're involved in
CREATE POLICY "Users can view related cancellations"
  ON cancellations FOR SELECT
  TO authenticated
  USING (
    cancelled_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM quote_requests
      WHERE quote_requests.id = quote_request_id
      AND quote_requests.client_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM payments
      WHERE payments.id = payment_id
      AND payments.client_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM payments p
      JOIN movers m ON p.mover_id = m.id
      WHERE p.id = payment_id
      AND m.user_id = auth.uid()
    )
  );

-- Admins can view all cancellations
CREATE POLICY "Admins can view all cancellations"
  ON cancellations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Admins can manage cancellations
CREATE POLICY "Admins can manage cancellations"
  ON cancellations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- RLS Policies for admins

-- Admins can view other admins
CREATE POLICY "Admins can view admins"
  ON admins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid()
    )
  );

-- Super admins can manage admins
CREATE POLICY "Super admins can manage admins"
  ON admins FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.role = 'super_admin'
    )
  );

-- Update quotes policies for better privacy
-- Drop existing policies first
DROP POLICY IF EXISTS "Movers can view all quotes" ON quotes;
DROP POLICY IF EXISTS "Clients can view quotes on own requests" ON quotes;
DROP POLICY IF EXISTS "Movers can create quotes" ON quotes;
DROP POLICY IF EXISTS "Movers can update own pending quotes" ON quotes;

-- Movers can view all quotes (to see competition, but they already could see quote requests)
CREATE POLICY "Movers can view all quotes"
  ON quotes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.user_id = auth.uid()
      AND movers.verification_status = 'verified'
    )
  );

-- Clients can view quotes on their own quote requests
CREATE POLICY "Clients can view quotes on own requests"
  ON quotes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quote_requests
      WHERE quote_requests.id = quote_request_id
      AND quote_requests.client_user_id = auth.uid()
    )
  );

-- Movers can create quotes on their own behalf
CREATE POLICY "Movers can create quotes"
  ON quotes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = mover_id
      AND movers.user_id = auth.uid()
      AND movers.verification_status = 'verified'
    )
  );

-- Movers can update their own pending quotes
CREATE POLICY "Movers can update own pending quotes"
  ON quotes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = mover_id
      AND movers.user_id = auth.uid()
    )
    AND status = 'pending'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = mover_id
      AND movers.user_id = auth.uid()
    )
  );

-- Admins can view all quotes
CREATE POLICY "Admins can view all quotes"
  ON quotes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Admins can manage quotes
CREATE POLICY "Admins can manage quotes"
  ON quotes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Update quote_requests policies for mover access
DROP POLICY IF EXISTS "Movers can view quote requests" ON quote_requests;

-- Movers can view all quote requests (but client contact info will be hidden in app logic until payment)
CREATE POLICY "Movers can view quote requests"
  ON quote_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.user_id = auth.uid()
      AND movers.verification_status = 'verified'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_quote_request ON quotes(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_quotes_mover ON quotes(mover_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_payments_quote_request ON payments(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_mover ON payments(mover_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_cancellations_quote_request ON cancellations(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);