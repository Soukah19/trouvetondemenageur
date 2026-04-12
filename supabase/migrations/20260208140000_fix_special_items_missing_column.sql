-- Fix: Remove reference to nonexistent special_items column in quote_requests
-- The create_contract_on_payment trigger was referencing v_quote_request.special_items
-- but this column was never added to the quote_requests table, causing:
-- ERROR 42703: record "v_quote_request" has no field "special_items"

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
  v_mover_price numeric;
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
    
    -- Calculate mover price (the original price the mover proposed)
    -- v_quote.price is the mover's original price, client_display_price = price * 1.3
    v_mover_price := COALESCE(v_quote.price, ROUND(COALESCE(v_quote.client_display_price, NEW.total_amount) / 1.3));
    
    -- Generate contract number
    v_contract_number := generate_contract_number();
    
    -- Build contract data (without platform fee details)
    v_contract_data := jsonb_build_object(
      'contract_number', v_contract_number,
      'created_at', now(),
      'moving_date', v_quote_request.moving_date,
      
      -- Client info (includes phone)
      'client', jsonb_build_object(
        'name', v_quote_request.client_name,
        'email', v_quote_request.client_email,
        'phone', COALESCE(v_quote_request.client_phone, '')
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
      
      -- Financial (includes mover_price for mover-side display)
      'financial', jsonb_build_object(
        'total_amount', NEW.total_amount,
        'deposit_amount', NEW.deposit_amount,
        'remaining_amount', NEW.remaining_amount,
        'mover_price', v_mover_price
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
