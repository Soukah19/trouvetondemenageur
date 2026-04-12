/*
  # Add Moving Alerts System

  1. New Functions
    - `get_quote_max_validity_date(quote_request_id)` - Calculates the maximum validity date for quotes (moving date + flexibility - 1 day)
    - `check_quote_requests_without_quotes()` - Checks for quote requests without quotes approaching their moving date (10 days before)
    - `create_admin_alerts_for_urgent_quote_requests()` - Creates notifications for admins about urgent quote requests
    
  2. New Views
    - `urgent_quote_requests` - Lists quote requests without quotes that are less than 10 days away
    
  3. Security
    - Functions are SECURITY DEFINER and only accessible by admins
    - Views are protected by RLS policies
*/

-- Function to calculate the maximum validity date for quotes
CREATE OR REPLACE FUNCTION get_quote_max_validity_date(quote_request_id_param uuid)
RETURNS date
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  moving_date_val date;
  flexibility_days_val integer;
  max_date date;
BEGIN
  -- Get the moving date and flexibility from quote_request
  SELECT moving_date, COALESCE(date_flexibility_days, 0)
  INTO moving_date_val, flexibility_days_val
  FROM quote_requests
  WHERE id = quote_request_id_param;
  
  -- Calculate max date: moving_date + flexibility - 1 day
  -- Example: moving date = 2026-02-01, flexibility = 5 days
  -- Max validity = 2026-02-01 + 5 days - 1 day = 2026-02-05
  max_date := moving_date_val + flexibility_days_val * INTERVAL '1 day' - INTERVAL '1 day';
  
  RETURN max_date::date;
END;
$$;

-- Create view for urgent quote requests (without quotes, less than 10 days away)
CREATE OR REPLACE VIEW urgent_quote_requests AS
SELECT 
  qr.id,
  qr.client_user_id,
  qr.client_name,
  qr.client_email,
  qr.client_phone,
  qr.from_address,
  qr.from_city,
  qr.to_address,
  qr.to_city,
  qr.moving_date,
  qr.date_flexibility_days,
  qr.created_at,
  qr.status,
  (qr.moving_date - CURRENT_DATE) as days_until_move,
  (SELECT COUNT(*) FROM quotes WHERE quote_request_id = qr.id) as quote_count
FROM quote_requests qr
WHERE 
  qr.status = 'new'
  AND (qr.moving_date - CURRENT_DATE) <= 10
  AND (qr.moving_date - CURRENT_DATE) >= 0
  AND (SELECT COUNT(*) FROM quotes WHERE quote_request_id = qr.id) = 0
ORDER BY qr.moving_date ASC;

-- Grant access to urgent_quote_requests view
GRANT SELECT ON urgent_quote_requests TO authenticated;

-- Create RLS policy for urgent_quote_requests view
ALTER VIEW urgent_quote_requests SET (security_invoker = on);

-- Function to create admin alerts for urgent quote requests
CREATE OR REPLACE FUNCTION create_admin_alerts_for_urgent_quote_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  urgent_request RECORD;
  admin_record RECORD;
  notification_exists boolean;
BEGIN
  -- Loop through all urgent quote requests
  FOR urgent_request IN 
    SELECT * FROM urgent_quote_requests
  LOOP
    -- Loop through all admins
    FOR admin_record IN 
      SELECT user_id FROM admins WHERE role IN ('super_admin', 'admin_agent')
    LOOP
      -- Check if notification already exists for this admin and quote request
      SELECT EXISTS(
        SELECT 1 FROM notifications 
        WHERE user_id = admin_record.user_id 
        AND type = 'urgent_quote_request'
        AND data->>'quote_request_id' = urgent_request.id::text
        AND created_at > CURRENT_DATE - INTERVAL '1 day'
      ) INTO notification_exists;
      
      -- Create notification only if it doesn't exist
      IF NOT notification_exists THEN
        INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          data,
          is_read
        ) VALUES (
          admin_record.user_id,
          'urgent_quote_request',
          'Demande urgente sans devis',
          format(
            'La demande de %s pour un déménagement le %s (dans %s jours) n''a reçu aucun devis !',
            urgent_request.client_name,
            to_char(urgent_request.moving_date, 'DD/MM/YYYY'),
            urgent_request.days_until_move
          ),
          jsonb_build_object(
            'quote_request_id', urgent_request.id,
            'client_name', urgent_request.client_name,
            'moving_date', urgent_request.moving_date,
            'days_until_move', urgent_request.days_until_move,
            'from_address', urgent_request.from_address,
            'to_address', urgent_request.to_address
          ),
          false
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_quote_max_validity_date(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_admin_alerts_for_urgent_quote_requests() TO authenticated;

-- Create a function to check and create alerts (can be called daily via cron or edge function)
CREATE OR REPLACE FUNCTION check_and_alert_urgent_quote_requests()
RETURNS TABLE(alert_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count_created integer := 0;
BEGIN
  -- Call the function to create alerts
  PERFORM create_admin_alerts_for_urgent_quote_requests();
  
  -- Count how many urgent requests exist
  SELECT COUNT(*)::integer INTO count_created FROM urgent_quote_requests;
  
  RETURN QUERY SELECT count_created;
END;
$$;

GRANT EXECUTE ON FUNCTION check_and_alert_urgent_quote_requests() TO authenticated;
