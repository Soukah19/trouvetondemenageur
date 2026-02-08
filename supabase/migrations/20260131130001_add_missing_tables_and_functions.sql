/*
  # Add Missing Tables and Functions
  
  This migration adds:
  1. activity_logs table for admin activity tracking
  2. get_expiring_documents RPC function
*/

-- Create activity_logs table if not exists
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_type text,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on activity_logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all activity logs
DROP POLICY IF EXISTS "Admins can view all activity logs" ON activity_logs;
CREATE POLICY "Admins can view all activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
    )
  );

-- Policy to insert activity logs
DROP POLICY IF EXISTS "Anyone can insert activity logs" ON activity_logs;
CREATE POLICY "Anyone can insert activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);

-- DROP existing function first to avoid return type conflict
DROP FUNCTION IF EXISTS get_expiring_documents(integer);
DROP FUNCTION IF EXISTS get_expiring_documents();

-- Create get_expiring_documents function
CREATE OR REPLACE FUNCTION get_expiring_documents(days_threshold integer DEFAULT 30)
RETURNS TABLE (
  mover_id uuid,
  company_name text,
  document_type text,
  expiration_date date,
  days_until_expiration integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as mover_id,
    m.company_name,
    'kbis' as document_type,
    m.kbis_expiration_date::date as expiration_date,
    (m.kbis_expiration_date::date - CURRENT_DATE)::integer as days_until_expiration
  FROM movers m
  WHERE m.kbis_expiration_date IS NOT NULL
    AND m.kbis_expiration_date::date - CURRENT_DATE <= days_threshold
    AND m.verification_status = 'verified'
  
  UNION ALL
  
  SELECT 
    m.id as mover_id,
    m.company_name,
    'insurance' as document_type,
    m.insurance_expiration_date::date as expiration_date,
    (m.insurance_expiration_date::date - CURRENT_DATE)::integer as days_until_expiration
  FROM movers m
  WHERE m.insurance_expiration_date IS NOT NULL
    AND m.insurance_expiration_date::date - CURRENT_DATE <= days_threshold
    AND m.verification_status = 'verified'
  
  UNION ALL
  
  SELECT 
    m.id as mover_id,
    m.company_name,
    'identity' as document_type,
    m.identity_expiration_date::date as expiration_date,
    (m.identity_expiration_date::date - CURRENT_DATE)::integer as days_until_expiration
  FROM movers m
  WHERE m.identity_expiration_date IS NOT NULL
    AND m.identity_expiration_date::date - CURRENT_DATE <= days_threshold
    AND m.verification_status = 'verified'
  
  ORDER BY days_until_expiration ASC;
END;
$$;
