-- 013: Trip messages (contextual chat between shipper and carrier)
-- Messages are anchored to trips. Both parties can send text + optional image.
-- Supports read receipts and unread counts.

CREATE TABLE IF NOT EXISTS trip_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL CHECK (char_length(body) > 0 AND char_length(body) <= 2000),
  image_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fetching messages by trip (ordered by time)
CREATE INDEX IF NOT EXISTS idx_trip_messages_trip
  ON trip_messages(trip_id, created_at);

-- Index for unread count queries
CREATE INDEX IF NOT EXISTS idx_trip_messages_unread
  ON trip_messages(trip_id, sender_id) WHERE read_at IS NULL;

-- RLS
ALTER TABLE trip_messages ENABLE ROW LEVEL SECURITY;

-- Both shipper and carrier on the trip can read all messages
CREATE POLICY trip_messages_select ON trip_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips t
      JOIN loads l ON l.id = t.load_id
      WHERE t.id = trip_messages.trip_id
        AND (t.carrier_id = auth.uid() OR l.shipper_id = auth.uid())
    )
  );

-- Only trip participants can insert (as themselves)
CREATE POLICY trip_messages_insert ON trip_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM trips t
      JOIN loads l ON l.id = t.load_id
      WHERE t.id = trip_messages.trip_id
        AND (t.carrier_id = auth.uid() OR l.shipper_id = auth.uid())
    )
  );

-- Recipient can mark messages as read (update read_at on messages they didn't send)
CREATE POLICY trip_messages_update ON trip_messages
  FOR UPDATE USING (
    sender_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM trips t
      JOIN loads l ON l.id = t.load_id
      WHERE t.id = trip_messages.trip_id
        AND (t.carrier_id = auth.uid() OR l.shipper_id = auth.uid())
    )
  );
