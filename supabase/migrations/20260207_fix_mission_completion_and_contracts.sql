-- Fix 1: Create RPC function for mission completion (bypasses RLS)
-- This allows movers to complete missions even if direct RLS policies are restrictive
CREATE OR REPLACE FUNCTION complete_mission(
  p_payment_id UUID,
  p_quote_request_id UUID,
  p_analysis JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mover_user_id UUID;
  v_quote_mover_id UUID;
BEGIN
  -- Get current user
  v_mover_user_id := auth.uid();
  
  -- Verify the mover owns this payment through their quote
  SELECT q.mover_id INTO v_quote_mover_id
  FROM payments p
  JOIN quotes q ON q.id = p.quote_id
  JOIN movers m ON m.id = q.mover_id
  WHERE p.id = p_payment_id
    AND m.user_id = v_mover_user_id;
  
  IF v_quote_mover_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: you do not own this mission';
  END IF;

  -- Update payment
  UPDATE payments
  SET 
    mission_completion_status = 'completed_pending_review',
    mission_completion_date = NOW(),
    ai_analysis_result = p_analysis,
    release_requested_at = NOW()
  WHERE id = p_payment_id;

  -- Update quote request status
  UPDATE quote_requests
  SET status = 'completed'
  WHERE id = p_quote_request_id;

  -- Upsert moving_status
  INSERT INTO moving_status (quote_request_id, status, completed_at)
  VALUES (p_quote_request_id, 'completed', NOW())
  ON CONFLICT (quote_request_id) 
  DO UPDATE SET status = 'completed', completed_at = NOW();

END;
$$;

-- Fix 2: Ensure movers can update payments for their own quotes
DO $$
BEGIN
  -- Allow movers to update mission_completion_status on their payments
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payments' 
    AND policyname = 'movers_can_complete_mission'
  ) THEN
    CREATE POLICY movers_can_complete_mission ON payments
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM quotes q
        JOIN movers m ON m.id = q.mover_id
        WHERE q.id = payments.quote_id
        AND m.user_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM quotes q
        JOIN movers m ON m.id = q.mover_id
        WHERE q.id = payments.quote_id
        AND m.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Fix 3: Ensure movers can update quote_requests status to completed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quote_requests' 
    AND policyname = 'movers_can_complete_quote_requests'
  ) THEN
    CREATE POLICY movers_can_complete_quote_requests ON quote_requests
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM quotes q
        JOIN movers m ON m.id = q.mover_id
        WHERE q.quote_request_id = quote_requests.id
        AND q.status = 'accepted'
        AND m.user_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM quotes q
        JOIN movers m ON m.id = q.mover_id
        WHERE q.quote_request_id = quote_requests.id
        AND q.status = 'accepted'
        AND m.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Fix 4: Create admin_contracts_view if it doesn't exist
DO $$
BEGIN
  -- Check if the view exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_name = 'admin_contracts_view'
  ) THEN
    EXECUTE '
      CREATE OR REPLACE VIEW admin_contracts_view AS
      SELECT 
        c.id,
        c.contract_number,
        c.status,
        c.created_at,
        c.pdf_url,
        c.sent_to_client,
        c.sent_to_mover,
        COALESCE(qr.moving_date::text, '''') as moving_date,
        COALESCE(qr.client_name, ''Client'') as client_name,
        COALESCE(u.email, '''') as client_email,
        COALESCE(m.company_name, ''Déménageur'') as mover_company,
        COALESCE(mu.email, '''') as mover_email,
        COALESCE(qr.from_city, '''') as from_city,
        COALESCE(qr.to_city, '''') as to_city,
        COALESCE((c.contract_data->>''total_amount'')::numeric, 0) as total_amount,
        COALESCE(c.quote_request_id::text, '''') as quote_request_id,
        COALESCE(c.mover_id::text, '''') as mover_id
      FROM contracts c
      LEFT JOIN quote_requests qr ON qr.id = c.quote_request_id
      LEFT JOIN users u ON u.id = qr.client_user_id
      LEFT JOIN movers m ON m.id = c.mover_id
      LEFT JOIN users mu ON mu.id = m.user_id
    ';
  END IF;
END $$;

-- Fix 5: Ensure clients can read their own contracts (both schema versions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contracts' 
    AND policyname = 'clients_read_own_contracts_v2'
  ) THEN
    CREATE POLICY clients_read_own_contracts_v2 ON contracts
    FOR SELECT
    USING (
      client_user_id = auth.uid()
      OR client_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM quote_requests qr
        WHERE qr.id = contracts.quote_request_id
        AND qr.client_user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Fix 6: Ensure clients can insert contracts (for manual creation fallback)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contracts' 
    AND policyname = 'clients_insert_contracts_v2'
  ) THEN
    CREATE POLICY clients_insert_contracts_v2 ON contracts
    FOR INSERT
    WITH CHECK (
      client_user_id = auth.uid()
      OR client_id = auth.uid()
    );
  END IF;
END $$;

-- Fix 7: Ensure admins can read all contracts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contracts' 
    AND policyname = 'admins_read_all_contracts'
  ) THEN
    CREATE POLICY admins_read_all_contracts ON contracts
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM admins WHERE user_id = auth.uid()
      )
    );
  END IF;
END $$;
