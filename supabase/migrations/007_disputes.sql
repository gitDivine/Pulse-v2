-- 007: Disputes system for handling delivery issues
-- Run this after 006_carrier_directory.sql
-- Safe to re-run — drops and recreates table cleanly

-- Clean up any broken state from partial runs
DROP TABLE IF EXISTS disputes CASCADE;

-- Dispute type enum
DO $$ BEGIN
  CREATE TYPE dispute_type AS ENUM (
    'damaged_goods', 'missing_items', 'wrong_items',
    'late_delivery', 'not_received', 'overcharge', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Dispute status enum
DO $$ BEGIN
  CREATE TYPE dispute_status AS ENUM (
    'open', 'carrier_responded', 'resolved', 'escalated'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Disputes table
CREATE TABLE disputes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  load_id     UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  filed_by    UUID NOT NULL REFERENCES profiles(id),
  type        dispute_type NOT NULL,
  description TEXT NOT NULL,
  evidence_urls TEXT[] DEFAULT '{}',
  status      dispute_status DEFAULT 'open',
  carrier_response TEXT,
  resolution_note TEXT,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- One dispute per trip
CREATE UNIQUE INDEX idx_disputes_trip ON disputes(trip_id);

-- Indexes
CREATE INDEX idx_disputes_filed_by ON disputes(filed_by);
CREATE INDEX idx_disputes_status ON disputes(status);

-- Auto-update timestamp
CREATE TRIGGER disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Shipper (filed_by) can insert and select their disputes
CREATE POLICY disputes_filer ON disputes
  FOR ALL USING (filed_by = auth.uid());

-- Carrier can select and update disputes on their trips
CREATE POLICY disputes_carrier ON disputes
  FOR SELECT USING (
    trip_id IN (SELECT id FROM trips WHERE carrier_id = auth.uid())
  );

CREATE POLICY disputes_carrier_respond ON disputes
  FOR UPDATE USING (
    trip_id IN (SELECT id FROM trips WHERE carrier_id = auth.uid())
  );

-- When a dispute is opened, set trip status to 'disputed'
CREATE OR REPLACE FUNCTION set_trip_disputed()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE trips SET status = 'disputed' WHERE id = NEW.trip_id;
  UPDATE loads SET status = 'delivered'
    WHERE id = NEW.load_id AND status = 'completed';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_dispute_created
  AFTER INSERT ON disputes
  FOR EACH ROW EXECUTE FUNCTION set_trip_disputed();

-- Storage bucket for dispute evidence
INSERT INTO storage.buckets (id, name, public)
VALUES ('dispute-evidence', 'dispute-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone authenticated can upload to dispute-evidence
DO $$ BEGIN
  CREATE POLICY "dispute_evidence_upload" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'dispute-evidence');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Public read for dispute evidence
DO $$ BEGIN
  CREATE POLICY "dispute_evidence_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'dispute-evidence');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
