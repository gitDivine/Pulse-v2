-- 008_scout_v1.sql — SCOUT V1: Delivery-confirmed address database
-- When a delivery is confirmed, both origin and destination addresses
-- are upserted into the addresses table, building a crowdsourced
-- verified address database over time.

-- 1. Add unique constraint to prevent duplicate addresses
--    Match on: lower(raw_address), lower(city), lower(state)
CREATE UNIQUE INDEX IF NOT EXISTS idx_addresses_unique_location
  ON addresses (lower(raw_address), lower(city), lower(state));

-- 2. Add source column to track where the address came from
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
-- source values: 'manual' (user contributed), 'delivery' (confirmed delivery), 'load' (from load posting)

-- 3. Add last_verified_at timestamp
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

-- 4. Function: upsert an address from a confirmed delivery
--    If address exists: increment delivery_count, recalculate confidence, update last_verified_at
--    If new: insert with delivery_count=1, confidence=0.3, source='delivery'
CREATE OR REPLACE FUNCTION upsert_delivery_address(
  p_raw_address TEXT,
  p_landmark TEXT,
  p_city TEXT,
  p_state TEXT,
  p_lga TEXT,
  p_contributor_id UUID
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_new_count INT;
  v_confidence NUMERIC;
BEGIN
  -- Try to find existing address (case-insensitive)
  SELECT id, delivery_count + 1 INTO v_id, v_new_count
  FROM addresses
  WHERE lower(raw_address) = lower(p_raw_address)
    AND lower(city) = lower(p_city)
    AND lower(state) = lower(p_state);

  IF v_id IS NOT NULL THEN
    -- Confidence formula: 0.3 base + 0.1 per delivery, capped at 1.0
    v_confidence := LEAST(1.0, 0.3 + (v_new_count * 0.1));

    UPDATE addresses SET
      delivery_count = v_new_count,
      confidence_score = v_confidence,
      last_verified_at = now(),
      updated_at = now(),
      -- Update landmark if not set and one is provided
      landmark = COALESCE(addresses.landmark, p_landmark),
      -- Update LGA if not set and one is provided
      lga = COALESCE(addresses.lga, p_lga),
      source = 'delivery'
    WHERE id = v_id;

    RETURN v_id;
  ELSE
    -- Insert new address
    INSERT INTO addresses (raw_address, landmark, city, state, lga, contributor_id, confidence_score, delivery_count, source, last_verified_at)
    VALUES (p_raw_address, p_landmark, p_city, p_state, p_lga, p_contributor_id, 0.3, 1, 'delivery', now())
    RETURNING id INTO v_id;

    RETURN v_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update RLS: allow authenticated users to read all addresses (SCOUT is public data)
DROP POLICY IF EXISTS "Users can read all addresses" ON addresses;
CREATE POLICY "Users can read all addresses"
  ON addresses FOR SELECT
  TO authenticated
  USING (true);

-- 6. Index for fast autocomplete search
CREATE INDEX IF NOT EXISTS idx_addresses_search
  ON addresses USING gin (to_tsvector('simple', raw_address || ' ' || COALESCE(landmark, '') || ' ' || city));

CREATE INDEX IF NOT EXISTS idx_addresses_confidence
  ON addresses (confidence_score DESC, delivery_count DESC);
