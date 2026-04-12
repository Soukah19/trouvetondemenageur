/*
  # Fix Payments Insert Policy

  1. Problem
    - Clients cannot create payments due to missing INSERT policy
    - Current policies only allow SELECT for clients and ALL for admins

  2. Solution
    - Add INSERT policy for clients to create their own payments
    - Ensure clients can only create payments for their own quote requests

  3. Security
    - Client must be authenticated
    - Client must own the quote request (via client_id)
    - Prevents clients from creating payments for other users
*/

-- Add policy for clients to create payments
CREATE POLICY "Clients can create payments for own quotes"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());