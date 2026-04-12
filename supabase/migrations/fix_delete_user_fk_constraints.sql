-- Fix FK constraints that are missing ON DELETE behavior
-- These block deletion of movers and auth users

-- 1. payment_release_requests.mover_id -> movers(id) has NO ON DELETE clause
--    This causes "Database error deleting user" when trying to delete a mover
ALTER TABLE payment_release_requests
  DROP CONSTRAINT IF EXISTS payment_release_requests_mover_id_fkey;

ALTER TABLE payment_release_requests
  ADD CONSTRAINT payment_release_requests_mover_id_fkey
  FOREIGN KEY (mover_id) REFERENCES movers(id) ON DELETE CASCADE;

-- 2. payments.guarantee_decision_by -> auth.users(id) has NO ON DELETE clause
--    This blocks deletion of the auth user at the final step
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_guarantee_decision_by_fkey;

ALTER TABLE payments
  ADD CONSTRAINT payments_guarantee_decision_by_fkey
  FOREIGN KEY (guarantee_decision_by) REFERENCES auth.users(id) ON DELETE SET NULL;