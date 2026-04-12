/*
  # Fix notification types constraint and add INSERT policy

  1. Changes
    - Drop the restrictive CHECK constraint on notifications.type 
      (it was blocking new types like admin_modified_request, damage_alert, etc.)
    - Add a permissive INSERT policy for authenticated users
    - Add a DELETE policy so users can delete their own notifications

  2. Reason
    - The CHECK constraint only allowed a small set of types, blocking:
      admin_modified_request, damage_alert, payment_received, mission_started,
      mission_completed, contract_sent, contract_signed, mover_registration, etc.
    - No INSERT policy existed, causing client-side notification inserts to fail silently
*/

-- Drop the restrictive CHECK constraint entirely
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add INSERT policy for authenticated users (needed for client-side notification creation)
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
CREATE POLICY "Authenticated users can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add DELETE policy so users can delete their own notifications
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
