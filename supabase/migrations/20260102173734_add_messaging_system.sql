/*
  # Add Real-Time Messaging System

  ## Summary
  This migration adds a complete messaging system for real-time communication between clients and movers.

  ## New Tables
  
  ### `conversations`
  - `id` (uuid, primary key) - Unique conversation identifier
  - `quote_request_id` (uuid, foreign key) - Links to the quote request
  - `client_id` (uuid, foreign key) - Client user ID
  - `mover_id` (uuid, foreign key) - Mover ID
  - `status` (text) - Conversation status: 'active', 'archived'
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last message timestamp

  ### `messages`
  - `id` (uuid, primary key) - Unique message identifier
  - `conversation_id` (uuid, foreign key) - Links to conversation
  - `sender_id` (uuid, foreign key) - User who sent the message
  - `sender_type` (text) - 'client' or 'mover'
  - `content` (text) - Message content
  - `read` (boolean) - Read status
  - `read_at` (timestamptz) - When message was read
  - `created_at` (timestamptz) - Message timestamp

  ## Security
  - Enable RLS on both tables
  - Clients can only access conversations they're part of
  - Movers can only access conversations they're part of
  - Users can only send messages in their own conversations
  - Users can mark messages as read

  ## Performance
  - Index on conversation_id for fast message retrieval
  - Index on sender_id for user message queries
  - Index on created_at for chronological ordering
  - Index on read status for unread message counts
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid REFERENCES quote_requests(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mover_id uuid REFERENCES movers(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(quote_request_id, mover_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('client', 'mover')),
  content text NOT NULL,
  read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations

-- Clients can view their own conversations
CREATE POLICY "Clients can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

-- Movers can view conversations they're part of
CREATE POLICY "Movers can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = mover_id
      AND movers.user_id = auth.uid()
    )
  );

-- Clients can create conversations
CREATE POLICY "Clients can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

-- Movers can create conversations
CREATE POLICY "Movers can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = mover_id
      AND movers.user_id = auth.uid()
    )
  );

-- Users can update conversations they're part of
CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (
    client_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = mover_id
      AND movers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    client_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM movers
      WHERE movers.id = mover_id
      AND movers.user_id = auth.uid()
    )
  );

-- RLS Policies for messages

-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND (
        conversations.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM movers
          WHERE movers.id = conversations.mover_id
          AND movers.user_id = auth.uid()
        )
      )
    )
  );

-- Users can send messages in their conversations
CREATE POLICY "Users can send messages in own conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND (
        conversations.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM movers
          WHERE movers.id = conversations.mover_id
          AND movers.user_id = auth.uid()
        )
      )
    )
  );

-- Users can update messages they can view (for marking as read)
CREATE POLICY "Users can mark messages as read in own conversations"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND (
        conversations.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM movers
          WHERE movers.id = conversations.mover_id
          AND movers.user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND (
        conversations.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM movers
          WHERE movers.id = conversations.mover_id
          AND movers.user_id = auth.uid()
        )
      )
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_quote_request ON conversations(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_conversations_client ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_mover ON conversations(mover_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);

-- Function to update conversation updated_at on new message
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update conversation timestamp
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON messages;
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();
