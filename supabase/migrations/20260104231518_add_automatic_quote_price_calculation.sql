/*
  # Automatic Quote Price Calculation

  1. Purpose
    - Automatically calculate `client_display_price` when a quote is inserted or updated
    - Ensure consistent pricing model: client_display_price = mover_price * 1.3
    - Calculate price indicator and market estimate

  2. Changes
    - Create trigger function to calculate client_display_price on quotes insert/update
    - Set client_display_price = price * 1.3 (30% platform commission)
    - Update existing quotes to have correct client_display_price

  3. Business Logic
    - Mover sets their price (e.g., 1000€)
    - Platform adds 30% commission → Client sees 1300€
    - On 40% deposit: Platform takes 300€, Mover gets 220€
    - On remaining 60%: Client pays 780€ directly to mover
    - Total mover revenue: 220€ + 780€ = 1000€
    - Total platform revenue: 300€ (30% of mover price)
*/

-- Create function to calculate client display price
CREATE OR REPLACE FUNCTION calculate_quote_client_price()
RETURNS TRIGGER AS $$
BEGIN
  -- If price is set and client_display_price is not manually set, calculate it
  IF NEW.price IS NOT NULL AND (NEW.client_display_price IS NULL OR NEW.client_display_price = OLD.client_display_price) THEN
    NEW.client_display_price := ROUND(NEW.price * 1.3);
  END IF;
  
  -- If market_price_estimate is not set, estimate it (10-20% above mover price)
  IF NEW.market_price_estimate IS NULL THEN
    NEW.market_price_estimate := ROUND(NEW.price * 1.4);
  END IF;
  
  -- Calculate price indicator
  IF NEW.client_display_price IS NOT NULL AND NEW.market_price_estimate IS NOT NULL THEN
    DECLARE
      price_ratio numeric;
    BEGIN
      price_ratio := (NEW.client_display_price::numeric - NEW.market_price_estimate::numeric) / NEW.market_price_estimate::numeric;
      
      IF price_ratio <= -0.05 THEN  -- 5% below market
        NEW.price_indicator := 'green';
      ELSIF price_ratio <= 0.15 THEN  -- up to 15% above market
        NEW.price_indicator := 'orange';
      ELSE  -- more than 15% above market
        NEW.price_indicator := 'red';
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_calculate_quote_client_price ON quotes;

-- Create trigger
CREATE TRIGGER trigger_calculate_quote_client_price
  BEFORE INSERT OR UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION calculate_quote_client_price();

-- Update existing quotes to have correct client_display_price
UPDATE quotes
SET client_display_price = ROUND(price * 1.3)
WHERE client_display_price IS NULL OR client_display_price = price;