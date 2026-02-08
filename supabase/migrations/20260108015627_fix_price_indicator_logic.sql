/*
  # Fix Price Indicator Logic

  1. Problem
    - Current logic compares client_display_price (3250€) with market_price_estimate (2700€)
    - This gives incorrect indicator (red "Au-dessus du marché" when mover price 2500€ < market 2700€)
  
  2. Solution
    - Compare mover price (2500€) with market_price_estimate (2700€)
    - Market estimate should be based on mover prices, not client prices
    
  3. Changes
    - Update calculate_quote_client_price() function
    - Compare NEW.price with NEW.market_price_estimate instead of NEW.client_display_price
    - Market estimate calculation adjusted to be based on mover pricing
*/

-- Recreate function with corrected logic
CREATE OR REPLACE FUNCTION calculate_quote_client_price()
RETURNS TRIGGER AS $$
BEGIN
  -- If price is set and client_display_price is not manually set, calculate it
  IF NEW.price IS NOT NULL AND (NEW.client_display_price IS NULL OR NEW.client_display_price = OLD.client_display_price) THEN
    NEW.client_display_price := ROUND(NEW.price * 1.3);
  END IF;
  
  -- If market_price_estimate is not set, estimate it (around same range as mover price)
  IF NEW.market_price_estimate IS NULL THEN
    NEW.market_price_estimate := ROUND(NEW.price * 1.08);
  END IF;
  
  -- Calculate price indicator by comparing MOVER PRICE with MARKET ESTIMATE
  IF NEW.price IS NOT NULL AND NEW.market_price_estimate IS NOT NULL THEN
    DECLARE
      price_ratio numeric;
    BEGIN
      price_ratio := (NEW.price::numeric - NEW.market_price_estimate::numeric) / NEW.market_price_estimate::numeric;
      
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