/*
  # Enable Realtime for Movers Table

  1. Changes
    - Enable Realtime publication for the movers table
    - This allows the admin dashboard to receive real-time updates when new movers register

  2. Security
    - Realtime subscriptions still respect RLS policies
    - Only authenticated admins will receive updates based on existing policies
*/

-- Enable Realtime for movers table
ALTER PUBLICATION supabase_realtime ADD TABLE movers;
