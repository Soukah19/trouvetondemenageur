/*
  # Fix Welcome Email Triggers - Correct SQL Order

  1. Function Creation
    - Creates `trigger_send_welcome_email()` function FIRST
    - Uses pg_net to call send-welcome-email Edge Function
    - Sends mover data as JSON payload
  
  2. Trigger Creation
    - Creates trigger on movers table AFTER function exists
    - Fires AFTER INSERT to send welcome email automatically
    - Non-blocking async call via pg_net

  3. Security
    - Uses service role key for authenticated Edge Function calls
    - Handles errors gracefully without blocking inserts
*/

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 1: Create the function FIRST (before the trigger references it)
CREATE OR REPLACE FUNCTION trigger_send_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url text;
  service_role_key text;
  request_id bigint;
BEGIN
  -- Get Supabase URL and service role key from environment
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);

  -- If environment variables are not set, use defaults (will be set by Supabase)
  IF supabase_url IS NULL THEN
    supabase_url := TG_ARGV[0];
  END IF;

  -- Make async HTTP request to send-welcome-email Edge Function
  SELECT net.http_post(
    url := supabase_url || '/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'type', TG_TABLE_NAME,
      'record', row_to_json(NEW)
    )
  ) INTO request_id;

  -- Return NEW to allow the insert to complete
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the insert
  RAISE WARNING 'Failed to send welcome email: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create the trigger AFTER function exists
DROP TRIGGER IF EXISTS movers_welcome_email_trigger ON movers;

CREATE TRIGGER movers_welcome_email_trigger
  AFTER INSERT ON movers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_welcome_email();

-- Add comment explaining the trigger
COMMENT ON TRIGGER movers_welcome_email_trigger ON movers IS 
  'Automatically sends welcome email to new movers after account creation';
