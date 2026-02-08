/*
  # Add Quote Validity Date Validation

  1. New Constraints
    - Ensures quote validity_date does not exceed the maximum allowed date
    - Maximum date = moving_date + date_flexibility_days - 1 day
    
  2. New Triggers
    - `validate_quote_validity_date_before_insert` - Validates validity date before inserting a quote
    - `validate_quote_validity_date_before_update` - Validates validity date before updating a quote
    
  3. Business Logic
    - Example: Moving date = 2026-02-01, flexibility = 5 days
    - Maximum validity date = 2026-02-01 + 5 days - 1 day = 2026-02-05
*/

-- Function to validate quote validity date
CREATE OR REPLACE FUNCTION validate_quote_validity_date()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  max_validity_date date;
  moving_date_val date;
  flexibility_days_val integer;
BEGIN
  -- Get the moving date and flexibility from quote_request
  SELECT 
    moving_date, 
    COALESCE(date_flexibility_days, 0)
  INTO 
    moving_date_val, 
    flexibility_days_val
  FROM quote_requests
  WHERE id = NEW.quote_request_id;
  
  -- Calculate max validity date: moving_date + flexibility - 1 day
  max_validity_date := moving_date_val + (flexibility_days_val * INTERVAL '1 day') - INTERVAL '1 day';
  
  -- Check if validity_date exceeds the maximum
  IF NEW.validity_date > max_validity_date::date THEN
    RAISE EXCEPTION 
      'La date de validité du devis (%) ne peut pas dépasser le % (date du déménagement % + flexibilité % jour(s) - 1 jour)',
      NEW.validity_date,
      max_validity_date::date,
      moving_date_val,
      flexibility_days_val
    USING HINT = format('Date maximale autorisée: %s', max_validity_date::date);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for INSERT operations
DROP TRIGGER IF EXISTS validate_quote_validity_date_before_insert ON quotes;
CREATE TRIGGER validate_quote_validity_date_before_insert
  BEFORE INSERT ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION validate_quote_validity_date();

-- Create trigger for UPDATE operations
DROP TRIGGER IF EXISTS validate_quote_validity_date_before_update ON quotes;
CREATE TRIGGER validate_quote_validity_date_before_update
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  WHEN (OLD.validity_date IS DISTINCT FROM NEW.validity_date OR OLD.quote_request_id IS DISTINCT FROM NEW.quote_request_id)
  EXECUTE FUNCTION validate_quote_validity_date();

-- Add a helpful comment
COMMENT ON FUNCTION validate_quote_validity_date() IS 
'Validates that quote validity_date does not exceed moving_date + date_flexibility_days - 1 day';
