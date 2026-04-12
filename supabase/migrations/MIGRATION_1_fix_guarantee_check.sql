-- ============================================================
-- MIGRATION: Fix guarantee_status CHECK constraint
-- REQUIRED FOR: Both fixed and dynamic versions
-- RUN IN: Supabase SQL Editor
-- ============================================================

-- The new code writes guarantee_status = 'none' for payments
-- without guarantee. The existing CHECK constraint doesn't
-- include 'none', so we need to update it.

-- Step 1: Drop the old constraint
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_guarantee_status_check;

-- Step 2: Recreate with 'none' added
ALTER TABLE payments ADD CONSTRAINT payments_guarantee_status_check
  CHECK (guarantee_status IN ('none', 'held', 'released_to_mover', 'kept_for_client', 'partial_release'));

-- Verify
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'payments'::regclass 
  AND conname = 'payments_guarantee_status_check';