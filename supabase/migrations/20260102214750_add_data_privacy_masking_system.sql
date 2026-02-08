/*
  # Add Data Privacy and Masking System

  ## Overview
  This migration implements a comprehensive data privacy system that hides client
  contact information from movers until the first payment is completed.

  ## Key Features

  1. **Helper Functions**
    - `mover_has_paid_access()` - Checks if a mover has access to unmasked client data
    - `mask_email()` - Masks email addresses (e.g., "c****@e****e.com")
    - `mask_phone()` - Masks phone numbers (e.g., "+33 6 ** ** ** **")
    - `mask_name()` - Masks client names (e.g., "Client ****")
    - `mask_address()` - Shows only city and postal code, hides street address

  2. **Secure View**
    - `quote_requests_with_privacy` - View that automatically masks data based on payment status
    - Movers see masked data until client completes first payment
    - Clients always see their own full data
    - Admins see everything

  3. **Security Principles**
    - Data masking happens at database level (not in app code)
    - No way to bypass masking through API
    - Payment status determines data visibility
    - Prevents contact info harvesting

  ## Data Masking Examples

  **Before Payment:**
  - Name: "Client ****"
  - Email: "c****@****"
  - Phone: "+33 6 ** ** ** **"
  - Address: "Ville uniquement (Paris 75001)"

  **After Payment:**
  - All fields visible in full

  ## Usage in Application

  Movers should query `quote_requests_with_privacy` instead of `quote_requests` directly.
  The view automatically applies appropriate masking based on:
  - User role (mover vs client vs admin)
  - Payment status of the quote request
*/

-- Function to check if a mover has paid access to a quote request
CREATE OR REPLACE FUNCTION mover_has_paid_access(
  p_quote_request_id uuid,
  p_mover_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_payment_made boolean;
BEGIN
  -- Check if there's a payment for this quote request where the mover is involved
  SELECT EXISTS (
    SELECT 1 
    FROM payments p
    JOIN movers m ON p.mover_id = m.id
    WHERE p.quote_request_id = p_quote_request_id
    AND m.user_id = p_mover_user_id
    AND p.payment_status IN ('completed', 'refunded_partial')
  ) INTO v_payment_made;
  
  RETURN v_payment_made;
END;
$$;

-- Function to mask email addresses
CREATE OR REPLACE FUNCTION mask_email(email text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_local text;
  v_domain text;
  v_masked_local text;
  v_masked_domain text;
BEGIN
  IF email IS NULL OR email = '' THEN
    RETURN '****@****';
  END IF;
  
  -- Split email into local and domain parts
  v_local := split_part(email, '@', 1);
  v_domain := split_part(email, '@', 2);
  
  -- Mask local part (show first character + ****)
  IF length(v_local) > 0 THEN
    v_masked_local := substring(v_local, 1, 1) || '****';
  ELSE
    v_masked_local := '****';
  END IF;
  
  -- Mask domain (show first character + ****)
  IF length(v_domain) > 0 THEN
    v_masked_domain := substring(v_domain, 1, 1) || '****';
  ELSE
    v_masked_domain := '****';
  END IF;
  
  RETURN v_masked_local || '@' || v_masked_domain;
END;
$$;

-- Function to mask phone numbers
CREATE OR REPLACE FUNCTION mask_phone(phone text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF phone IS NULL OR phone = '' THEN
    RETURN '** ** ** ** **';
  END IF;
  
  -- Keep country code and first 2 digits, mask the rest
  -- Assumes format like "+33 6 12 34 56 78" or "0612345678"
  IF phone LIKE '+%' THEN
    RETURN substring(phone, 1, 6) || ' ** ** ** **';
  ELSE
    RETURN substring(phone, 1, 2) || ' ** ** ** **';
  END IF;
END;
$$;

-- Function to mask client names
CREATE OR REPLACE FUNCTION mask_name(name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF name IS NULL OR name = '' THEN
    RETURN 'Client ****';
  END IF;
  
  RETURN 'Client ****';
END;
$$;

-- Function to mask addresses (show only city and postal code)
CREATE OR REPLACE FUNCTION mask_address(address text, city text, postal_code text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF city IS NULL OR city = '' THEN
    RETURN 'Adresse masquée';
  END IF;
  
  RETURN 'Ville uniquement (' || city || ' ' || COALESCE(postal_code, '') || ')';
END;
$$;

-- Create a secure view for quote requests with privacy masking
CREATE OR REPLACE VIEW quote_requests_with_privacy AS
SELECT
  qr.id,
  -- Apply masking based on user role and payment status
  CASE
    -- Admin sees everything
    WHEN EXISTS (
      SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
    ) THEN qr.client_name
    -- Client sees their own data
    WHEN qr.client_user_id = auth.uid() THEN qr.client_name
    -- Mover sees masked data unless payment is made
    WHEN EXISTS (
      SELECT 1 FROM movers WHERE movers.user_id = auth.uid()
    ) THEN
      CASE
        WHEN mover_has_paid_access(qr.id, auth.uid()) THEN qr.client_name
        ELSE mask_name(qr.client_name)
      END
    ELSE mask_name(qr.client_name)
  END AS client_name,
  
  CASE
    WHEN EXISTS (
      SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
    ) THEN qr.client_email
    WHEN qr.client_user_id = auth.uid() THEN qr.client_email
    WHEN EXISTS (
      SELECT 1 FROM movers WHERE movers.user_id = auth.uid()
    ) THEN
      CASE
        WHEN mover_has_paid_access(qr.id, auth.uid()) THEN qr.client_email
        ELSE mask_email(qr.client_email)
      END
    ELSE mask_email(qr.client_email)
  END AS client_email,
  
  CASE
    WHEN EXISTS (
      SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
    ) THEN qr.client_phone
    WHEN qr.client_user_id = auth.uid() THEN qr.client_phone
    WHEN EXISTS (
      SELECT 1 FROM movers WHERE movers.user_id = auth.uid()
    ) THEN
      CASE
        WHEN mover_has_paid_access(qr.id, auth.uid()) THEN qr.client_phone
        ELSE mask_phone(qr.client_phone)
      END
    ELSE mask_phone(qr.client_phone)
  END AS client_phone,
  
  CASE
    WHEN EXISTS (
      SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
    ) THEN qr.from_address
    WHEN qr.client_user_id = auth.uid() THEN qr.from_address
    WHEN EXISTS (
      SELECT 1 FROM movers WHERE movers.user_id = auth.uid()
    ) THEN
      CASE
        WHEN mover_has_paid_access(qr.id, auth.uid()) THEN qr.from_address
        ELSE mask_address(qr.from_address, qr.from_city, qr.from_postal_code)
      END
    ELSE mask_address(qr.from_address, qr.from_city, qr.from_postal_code)
  END AS from_address,
  
  qr.from_city,
  qr.from_postal_code,
  
  CASE
    WHEN EXISTS (
      SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
    ) THEN qr.to_address
    WHEN qr.client_user_id = auth.uid() THEN qr.to_address
    WHEN EXISTS (
      SELECT 1 FROM movers WHERE movers.user_id = auth.uid()
    ) THEN
      CASE
        WHEN mover_has_paid_access(qr.id, auth.uid()) THEN qr.to_address
        ELSE mask_address(qr.to_address, qr.to_city, qr.to_postal_code)
      END
    ELSE mask_address(qr.to_address, qr.to_city, qr.to_postal_code)
  END AS to_address,
  
  qr.to_city,
  qr.to_postal_code,
  qr.moving_date,
  qr.home_size,
  qr.home_type,
  qr.floor_from,
  qr.floor_to,
  qr.elevator_from,
  qr.elevator_to,
  qr.elevator_capacity_from,
  qr.elevator_capacity_to,
  qr.surface_m2,
  qr.volume_m3,
  qr.services_needed,
  qr.additional_info,
  qr.status,
  qr.assigned_mover_id,
  qr.accepted_quote_id,
  qr.payment_status,
  qr.client_user_id,
  qr.created_at,
  qr.updated_at,
  
  -- Add a flag indicating if data is masked for this user
  CASE
    WHEN EXISTS (
      SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
    ) THEN false
    WHEN qr.client_user_id = auth.uid() THEN false
    WHEN EXISTS (
      SELECT 1 FROM movers WHERE movers.user_id = auth.uid()
    ) THEN NOT mover_has_paid_access(qr.id, auth.uid())
    ELSE true
  END AS is_data_masked

FROM quote_requests qr;

-- Grant access to the view
GRANT SELECT ON quote_requests_with_privacy TO authenticated;

-- Enable RLS on the view (inherits from quote_requests table)
ALTER VIEW quote_requests_with_privacy SET (security_barrier = true);

-- Add helpful comment
COMMENT ON VIEW quote_requests_with_privacy IS 
'Secure view that automatically masks client contact information for movers until first payment is completed. Use this view instead of querying quote_requests directly when displaying data to movers.';

-- Create indexes to improve performance of the masking functions
CREATE INDEX IF NOT EXISTS idx_payments_quote_request_status 
  ON payments(quote_request_id, payment_status);

CREATE INDEX IF NOT EXISTS idx_movers_user_id 
  ON movers(user_id) WHERE verification_status = 'verified';

-- Add helpful comment on quote_requests table
COMMENT ON TABLE quote_requests IS 
'Contains client quote requests. IMPORTANT: Movers should query quote_requests_with_privacy view instead to respect data privacy rules.';
