/*
  # Fix quote_requests_with_privacy view - Add missing fields

  1. Changes
    - Add missing fields to the view:
      - from_home_type
      - from_home_size
      - from_surface_m2
      - to_home_type
      - to_home_size
      - to_surface_m2
      - furniture_lift_needed_departure
      - furniture_lift_needed_arrival
      - date_flexibility_days

  2. Security
    - No security changes - these fields are not sensitive information
    - Same masking rules apply to all other fields
*/

DROP VIEW IF EXISTS quote_requests_with_privacy;

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
  qr.from_home_type,
  qr.from_home_size,
  qr.from_surface_m2,
  qr.to_home_type,
  qr.to_home_size,
  qr.to_surface_m2,
  qr.furniture_lift_needed_departure,
  qr.furniture_lift_needed_arrival,
  qr.date_flexibility_days,
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
