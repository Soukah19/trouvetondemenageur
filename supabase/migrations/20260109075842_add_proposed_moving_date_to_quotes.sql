/*
  # Add Proposed Moving Date to Quotes

  1. Changes
    - Add `proposed_moving_date` column to `quotes` table
    - This allows movers to select a specific date within the client's flexibility window
    
  2. Business Logic
    - Client specifies: moving_date + date_flexibility_days
    - Mover chooses: proposed_moving_date (within the flexibility range)
    - Example: moving_date = 2026-01-24, flexibility = 3 days
      - Valid range: 2026-01-24 to 2026-01-27
      - Mover can select any date in this range
    
  3. Validation
    - proposed_moving_date must be >= moving_date
    - proposed_moving_date must be <= moving_date + date_flexibility_days
*/

-- Add proposed_moving_date column to quotes table
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS proposed_moving_date date;

-- Add comment
COMMENT ON COLUMN quotes.proposed_moving_date IS 
'The specific moving date proposed by the mover (must be within the client flexibility window)';

-- Function to validate proposed moving date is within flexibility range
CREATE OR REPLACE FUNCTION validate_proposed_moving_date()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  moving_date_val date;
  flexibility_days_val integer;
  min_date date;
  max_date date;
BEGIN
  -- Only validate if proposed_moving_date is set
  IF NEW.proposed_moving_date IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get the moving date and flexibility from quote_request
  SELECT 
    moving_date, 
    COALESCE(date_flexibility_days, 0)
  INTO 
    moving_date_val, 
    flexibility_days_val
  FROM quote_requests
  WHERE id = NEW.quote_request_id;
  
  -- Calculate valid date range
  min_date := moving_date_val;
  max_date := moving_date_val + (flexibility_days_val * INTERVAL '1 day');
  
  -- Check if proposed date is within range
  IF NEW.proposed_moving_date < min_date OR NEW.proposed_moving_date > max_date THEN
    RAISE EXCEPTION 
      'La date proposée (%) doit être entre le % et le % (date du déménagement + flexibilité % jour(s))',
      NEW.proposed_moving_date,
      min_date,
      max_date,
      flexibility_days_val
    USING HINT = format('Plage valide: du %s au %s', min_date, max_date);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for INSERT operations
DROP TRIGGER IF EXISTS validate_proposed_moving_date_before_insert ON quotes;
CREATE TRIGGER validate_proposed_moving_date_before_insert
  BEFORE INSERT ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION validate_proposed_moving_date();

-- Create trigger for UPDATE operations
DROP TRIGGER IF EXISTS validate_proposed_moving_date_before_update ON quotes;
CREATE TRIGGER validate_proposed_moving_date_before_update
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  WHEN (OLD.proposed_moving_date IS DISTINCT FROM NEW.proposed_moving_date OR OLD.quote_request_id IS DISTINCT FROM NEW.quote_request_id)
  EXECUTE FUNCTION validate_proposed_moving_date();

-- Add helpful comment
COMMENT ON FUNCTION validate_proposed_moving_date() IS 
'Validates that proposed_moving_date is within the client flexibility window (moving_date to moving_date + date_flexibility_days)';
