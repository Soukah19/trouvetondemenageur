/*
  # Fix Mover Quotes Update Policy
  
  1. Issue
    - Current policy only allows movers to update quotes with status = 'pending'
    - Movers need to be able to update expired quotes (to resubmit) and accepted quotes (to adjust)
    
  2. Solution
    - Drop the restrictive policy
    - Create a new policy that allows movers to update their own quotes regardless of status
    - Add check to prevent updating rejected quotes
*/

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Movers can update own pending quotes" ON quotes;

-- Create new policy that allows movers to update their own quotes
-- They can update pending, expired, or accepted quotes (but not rejected)
CREATE POLICY "Movers can update own quotes"
  ON quotes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = quotes.mover_id
      AND movers.user_id = auth.uid()
    )
    AND status != 'rejected'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = quotes.mover_id
      AND movers.user_id = auth.uid()
    )
  );

-- Also ensure movers can delete their own quotes
DROP POLICY IF EXISTS "Movers can delete own quotes" ON quotes;
CREATE POLICY "Movers can delete own quotes"
  ON quotes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = quotes.mover_id
      AND movers.user_id = auth.uid()
    )
    AND status IN ('pending', 'expired')
  );
