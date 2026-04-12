/*
  # Add Bank Details (RIB) for Movers and Contracts System
  
  ## Changes:
  1. Add RIB/IBAN/BIC fields to movers table
  2. Create contracts table to store generated contracts
  3. Add indexes for performance
  4. Update payment flow triggers
*/

-- ============================================
-- 1. ADD BANK DETAILS TO MOVERS TABLE
-- ============================================

DO $$
BEGIN
  -- Add IBAN field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movers' AND column_name = 'iban'
  ) THEN
    ALTER TABLE movers ADD COLUMN iban text;
  END IF;

  -- Add BIC field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movers' AND column_name = 'bic'
  ) THEN
    ALTER TABLE movers ADD COLUMN bic text;
  END IF;

  -- Add bank name field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movers' AND column_name = 'bank_name'
  ) THEN
    ALTER TABLE movers ADD COLUMN bank_name text;
  END IF;

  -- Add account holder name (if different from company)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movers' AND column_name = 'account_holder_name'
  ) THEN
    ALTER TABLE movers ADD COLUMN account_holder_name text;
  END IF;

  -- Add bank details verified flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movers' AND column_name = 'bank_details_verified'
  ) THEN
    ALTER TABLE movers ADD COLUMN bank_details_verified boolean DEFAULT false;
  END IF;
END $$;

-- ============================================
-- 2. CREATE CONTRACTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  quote_request_id uuid NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES payments(id) ON DELETE SET NULL,
  
  -- Parties
  client_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  mover_id uuid NOT NULL REFERENCES movers(id) ON DELETE CASCADE,
  
  -- Contract reference number
  contract_number text NOT NULL UNIQUE,
  
  -- Contract content (JSON with all details)
  contract_data jsonb NOT NULL,
  
  -- PDF storage
  pdf_url text,
  pdf_generated_at timestamptz,
  
  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'disputed')),
  
  -- Email tracking
  sent_to_client boolean DEFAULT false,
  sent_to_client_at timestamptz,
  sent_to_mover boolean DEFAULT false,
  sent_to_mover_at timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contracts_quote_request_id ON contracts(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_contracts_quote_id ON contracts(quote_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client_user_id ON contracts(client_user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_mover_id ON contracts(mover_id);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at DESC);

-- Enable RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can view their own contracts
CREATE POLICY "Clients can view their own contracts"
  ON contracts
  FOR SELECT
  TO authenticated
  USING (client_user_id = auth.uid());

-- Policy: Movers can view their own contracts
CREATE POLICY "Movers can view their own contracts"
  ON contracts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = contracts.mover_id
      AND movers.user_id = auth.uid()
    )
  );

-- Policy: Admins can view all contracts
CREATE POLICY "Admins can view all contracts"
  ON contracts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- Policy: System can insert contracts (via trigger/function)
CREATE POLICY "System can insert contracts"
  ON contracts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Admins can update contracts
CREATE POLICY "Admins can update contracts"
  ON contracts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- ============================================
-- 3. FUNCTION TO GENERATE CONTRACT NUMBER
-- ============================================

CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_year text;
  v_month text;
  v_sequence int;
  v_contract_number text;
BEGIN
  v_year := to_char(now(), 'YYYY');
  v_month := to_char(now(), 'MM');
  
  -- Get next sequence number for this month
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(contract_number FROM 'TTD-\d{4}-\d{2}-(\d+)') AS int)
  ), 0) + 1
  INTO v_sequence
  FROM contracts
  WHERE contract_number LIKE 'TTD-' || v_year || '-' || v_month || '-%';
  
  v_contract_number := 'TTD-' || v_year || '-' || v_month || '-' || LPAD(v_sequence::text, 5, '0');
  
  RETURN v_contract_number;
END;
$$;

-- ============================================
-- 4. FUNCTION TO CREATE CONTRACT ON PAYMENT
-- ============================================

CREATE OR REPLACE FUNCTION create_contract_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quote_request record;
  v_quote record;
  v_mover record;
  v_contract_number text;
  v_contract_data jsonb;
BEGIN
  -- Only create contract when payment is completed
  IF NEW.payment_status = 'completed' AND (OLD IS NULL OR OLD.payment_status != 'completed') THEN
    
    -- Get quote request details
    SELECT * INTO v_quote_request
    FROM quote_requests
    WHERE id = NEW.quote_request_id;
    
    -- Get quote details
    SELECT * INTO v_quote
    FROM quotes
    WHERE id = NEW.quote_id;
    
    -- Get mover details
    SELECT * INTO v_mover
    FROM movers
    WHERE id = NEW.mover_id;
    
    -- Generate contract number
    v_contract_number := generate_contract_number();
    
    -- Build contract data (without platform fee details)
    v_contract_data := jsonb_build_object(
      'contract_number', v_contract_number,
      'created_at', now(),
      'moving_date', v_quote_request.moving_date,
      
      -- Client info
      'client', jsonb_build_object(
        'name', v_quote_request.client_name,
        'email', v_quote_request.client_email,
        'phone', v_quote_request.client_phone
      ),
      
      -- Mover info
      'mover', jsonb_build_object(
        'company_name', v_mover.company_name,
        'siret', v_mover.siret,
        'manager_name', v_mover.manager_firstname || ' ' || v_mover.manager_lastname,
        'email', v_mover.email,
        'phone', v_mover.phone,
        'address', v_mover.address || ', ' || v_mover.postal_code || ' ' || v_mover.city
      ),
      
      -- Addresses
      'departure', jsonb_build_object(
        'address', v_quote_request.from_address,
        'city', v_quote_request.from_city,
        'postal_code', v_quote_request.from_postal_code,
        'floor', v_quote_request.floor_from,
        'elevator', v_quote_request.elevator_from
      ),
      'arrival', jsonb_build_object(
        'address', v_quote_request.to_address,
        'city', v_quote_request.to_city,
        'postal_code', v_quote_request.to_postal_code,
        'floor', v_quote_request.floor_to,
        'elevator', v_quote_request.elevator_to
      ),
      
      -- Details
      'home_size', v_quote_request.home_size,
      'home_type', v_quote_request.home_type,
      'volume_m3', v_quote_request.volume_m3,
      'services', v_quote_request.services_needed,
      'special_items', v_quote_request.special_items,
      
      -- Financial (simplified - no platform fee details shown)
      'financial', jsonb_build_object(
        'total_amount', NEW.total_amount,
        'deposit_amount', NEW.deposit_amount,
        'remaining_amount', NEW.remaining_amount
      )
    );
    
    -- Insert contract
    INSERT INTO contracts (
      quote_request_id,
      quote_id,
      payment_id,
      client_user_id,
      mover_id,
      contract_number,
      contract_data,
      status
    ) VALUES (
      NEW.quote_request_id,
      NEW.quote_id,
      NEW.id,
      v_quote_request.client_user_id,
      NEW.mover_id,
      v_contract_number,
      v_contract_data,
      'active'
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for contract creation
DROP TRIGGER IF EXISTS trigger_create_contract_on_payment ON payments;
CREATE TRIGGER trigger_create_contract_on_payment
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION create_contract_on_payment();

-- ============================================
-- 5. FIX PAYMENT STATUS TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_quote_status_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND (OLD IS NULL OR OLD.payment_status != 'completed') THEN
    -- Update quote to accepted
    UPDATE quotes SET status = 'accepted' WHERE id = NEW.quote_id;
    
    -- Update quote_request with 'deposit_paid' (this is what the UI expects!)
    UPDATE quote_requests 
    SET 
      accepted_quote_id = NEW.quote_id,
      payment_status = 'deposit_paid'
    WHERE id = NEW.quote_request_id;
    
    -- Reject other pending quotes
    UPDATE quotes 
    SET status = 'rejected' 
    WHERE quote_request_id = NEW.quote_request_id 
      AND id != NEW.quote_id 
      AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. VIEW FOR ADMIN TO SEE ALL CONTRACTS
-- ============================================

CREATE OR REPLACE VIEW admin_contracts_view AS
SELECT 
  c.id,
  c.contract_number,
  c.status,
  c.created_at,
  c.pdf_url,
  c.sent_to_client,
  c.sent_to_mover,
  c.contract_data->>'moving_date' as moving_date,
  c.contract_data->'client'->>'name' as client_name,
  c.contract_data->'client'->>'email' as client_email,
  c.contract_data->'mover'->>'company_name' as mover_company,
  c.contract_data->'mover'->>'email' as mover_email,
  c.contract_data->'departure'->>'city' as from_city,
  c.contract_data->'arrival'->>'city' as to_city,
  (c.contract_data->'financial'->>'total_amount')::numeric as total_amount,
  qr.id as quote_request_id,
  m.id as mover_id
FROM contracts c
JOIN quote_requests qr ON qr.id = c.quote_request_id
JOIN movers m ON m.id = c.mover_id
ORDER BY c.created_at DESC;

-- Grant access to view
GRANT SELECT ON admin_contracts_view TO authenticated;

-- ============================================
-- 7. FIX ANY EXISTING RECORDS
-- ============================================

-- Fix existing records with wrong payment_status
UPDATE quote_requests 
SET payment_status = 'deposit_paid' 
WHERE payment_status = 'completed';

-- Also fix records where quote is accepted but payment_status is wrong
UPDATE quote_requests qr
SET payment_status = 'deposit_paid'
WHERE EXISTS (
  SELECT 1 FROM quotes q 
  WHERE q.quote_request_id = qr.id 
  AND q.status = 'accepted'
)
AND qr.payment_status NOT IN ('deposit_paid', 'fully_paid');

SELECT 'Migration completed successfully!' as result;
