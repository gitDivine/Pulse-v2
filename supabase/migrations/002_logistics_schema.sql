-- PULSE Database Migration — Phase 2 (Logistics: HAUL + SCOUT + CONVOY)
-- All money values stored in kobo (₦1 = 100 kobo)

-- ============================================================
-- 1. New Enums
-- ============================================================

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'shipper';

CREATE TYPE load_status AS ENUM (
  'draft', 'posted', 'bidding', 'accepted', 'in_transit',
  'delivered', 'completed', 'cancelled'
);

CREATE TYPE bid_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');

CREATE TYPE trip_status AS ENUM (
  'pending', 'pickup', 'in_transit', 'delivered', 'confirmed', 'disputed'
);

CREATE TYPE cargo_type AS ENUM (
  'general', 'fragile', 'perishable', 'livestock',
  'heavy_machinery', 'documents', 'electronics', 'building_materials'
);

CREATE TYPE vehicle_type AS ENUM (
  'motorcycle', 'car', 'van', 'pickup_truck',
  'box_truck', 'flatbed', 'trailer', 'refrigerated'
);

CREATE TYPE tracking_event_type AS ENUM (
  'status_update', 'location_update', 'note', 'photo', 'issue'
);

-- ============================================================
-- 2. Modify Profiles — add logistics fields
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fleet_size INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avg_rating REAL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- ============================================================
-- 3. Modify Addresses — add SCOUT contributor tracking + LGA
-- ============================================================

ALTER TABLE addresses ADD COLUMN IF NOT EXISTS lga TEXT;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS contributor_id UUID REFERENCES profiles(id);
CREATE INDEX IF NOT EXISTS idx_addresses_contributor ON addresses(contributor_id);
CREATE INDEX IF NOT EXISTS idx_addresses_lga ON addresses(lga);

-- ============================================================
-- 4. Vehicles (carrier fleet)
-- ============================================================

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_type vehicle_type NOT NULL,
  plate_number TEXT NOT NULL,
  capacity_kg INTEGER NOT NULL DEFAULT 0,
  make TEXT,
  model TEXT,
  year INTEGER,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vehicles_owner ON vehicles(owner_id);
CREATE UNIQUE INDEX idx_vehicles_plate ON vehicles(plate_number);

-- ============================================================
-- 5. Loads (shipper freight postings)
-- ============================================================

CREATE TABLE loads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_number TEXT NOT NULL UNIQUE,
  shipper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Origin
  origin_address TEXT NOT NULL,
  origin_landmark TEXT,
  origin_city TEXT NOT NULL,
  origin_state TEXT NOT NULL,
  origin_lga TEXT,
  origin_lat DOUBLE PRECISION,
  origin_lng DOUBLE PRECISION,

  -- Destination
  destination_address TEXT NOT NULL,
  destination_landmark TEXT,
  destination_city TEXT NOT NULL,
  destination_state TEXT NOT NULL,
  destination_lga TEXT,
  destination_lat DOUBLE PRECISION,
  destination_lng DOUBLE PRECISION,

  -- Cargo
  cargo_type cargo_type NOT NULL DEFAULT 'general',
  cargo_description TEXT,
  weight_kg INTEGER,
  quantity INTEGER DEFAULT 1,
  special_instructions TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',

  -- Pricing
  budget_amount BIGINT, -- kobo, NULL = open to bids
  is_negotiable BOOLEAN NOT NULL DEFAULT true,

  -- Schedule
  pickup_date DATE NOT NULL,
  delivery_date DATE,

  -- Status
  status load_status NOT NULL DEFAULT 'draft',
  bid_count INTEGER NOT NULL DEFAULT 0,
  accepted_bid_id UUID, -- filled when a bid is accepted

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_loads_shipper ON loads(shipper_id);
CREATE INDEX idx_loads_status ON loads(status);
CREATE INDEX idx_loads_origin_state ON loads(origin_state);
CREATE INDEX idx_loads_destination_state ON loads(destination_state);
CREATE INDEX idx_loads_pickup_date ON loads(pickup_date);
CREATE INDEX idx_loads_cargo_type ON loads(cargo_type);

-- Generate load number: PLS-L-YYYYMMDD-XXXXX
CREATE OR REPLACE FUNCTION generate_load_number()
RETURNS TRIGGER AS $$
DECLARE
  daily_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO daily_count
  FROM loads
  WHERE DATE(created_at) = CURRENT_DATE;

  NEW.load_number := 'PLS-L-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(daily_count::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_load_number
  BEFORE INSERT ON loads
  FOR EACH ROW
  EXECUTE FUNCTION generate_load_number();

-- ============================================================
-- 6. Bids (carrier bids on loads)
-- ============================================================

CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  carrier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id),
  amount BIGINT NOT NULL, -- kobo
  estimated_hours INTEGER, -- estimated delivery time in hours
  message TEXT,
  status bid_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bids_load ON bids(load_id);
CREATE INDEX idx_bids_carrier ON bids(carrier_id);
CREATE INDEX idx_bids_status ON bids(status);
CREATE UNIQUE INDEX idx_bids_load_carrier ON bids(load_id, carrier_id);

-- Auto-increment load bid_count on insert
CREATE OR REPLACE FUNCTION increment_bid_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE loads SET bid_count = bid_count + 1, status = 'bidding'
  WHERE id = NEW.load_id AND status = 'posted';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_bid_insert
  AFTER INSERT ON bids
  FOR EACH ROW
  EXECUTE FUNCTION increment_bid_count();

-- ============================================================
-- 7. Trips (accepted bids become trips)
-- ============================================================

CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_number TEXT NOT NULL UNIQUE,
  load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  carrier_id UUID NOT NULL REFERENCES profiles(id),
  vehicle_id UUID REFERENCES vehicles(id),
  agreed_amount BIGINT NOT NULL, -- kobo
  status trip_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trips_load ON trips(load_id);
CREATE INDEX idx_trips_carrier ON trips(carrier_id);
CREATE INDEX idx_trips_status ON trips(status);

-- Generate trip number: PLS-T-YYYYMMDD-XXXXX
CREATE OR REPLACE FUNCTION generate_trip_number()
RETURNS TRIGGER AS $$
DECLARE
  daily_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO daily_count
  FROM trips
  WHERE DATE(created_at) = CURRENT_DATE;

  NEW.trip_number := 'PLS-T-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(daily_count::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_trip_number
  BEFORE INSERT ON trips
  FOR EACH ROW
  EXECUTE FUNCTION generate_trip_number();

-- ============================================================
-- 8. Tracking Events (trip updates + GPS breadcrumbs)
-- ============================================================

CREATE TABLE tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  event_type tracking_event_type NOT NULL DEFAULT 'status_update',
  description TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  photo_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tracking_events_trip ON tracking_events(trip_id);
CREATE INDEX idx_tracking_events_created ON tracking_events(created_at);

-- ============================================================
-- 9. Reviews (post-delivery ratings)
-- ============================================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewee_id UUID NOT NULL REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_trip ON reviews(trip_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE UNIQUE INDEX idx_reviews_trip_reviewer ON reviews(trip_id, reviewer_id);

-- Auto-update profile avg_rating on review insert
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET
    avg_rating = (SELECT AVG(rating)::REAL FROM reviews WHERE reviewee_id = NEW.reviewee_id),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE reviewee_id = NEW.reviewee_id)
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_insert
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_rating();

-- ============================================================
-- 10. Updated_at triggers for new tables
-- ============================================================

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_loads_updated_at BEFORE UPDATE ON loads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_bids_updated_at BEFORE UPDATE ON bids FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 11. Row Level Security
-- ============================================================

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Vehicles: owners manage their own
CREATE POLICY vehicles_owner ON vehicles FOR ALL USING (owner_id = auth.uid());

-- Loads: shippers manage their own, carriers can view posted loads
CREATE POLICY loads_shipper ON loads FOR ALL USING (shipper_id = auth.uid());
CREATE POLICY loads_public ON loads FOR SELECT USING (status IN ('posted', 'bidding'));

-- Bids: carriers manage their own, shippers see bids on their loads
CREATE POLICY bids_carrier ON bids FOR ALL USING (carrier_id = auth.uid());
CREATE POLICY bids_shipper ON bids FOR SELECT
  USING (load_id IN (SELECT id FROM loads WHERE shipper_id = auth.uid()));

-- Trips: participants only
CREATE POLICY trips_carrier ON trips FOR ALL USING (carrier_id = auth.uid());
CREATE POLICY trips_shipper ON trips FOR SELECT
  USING (load_id IN (SELECT id FROM loads WHERE shipper_id = auth.uid()));

-- Tracking events: trip participants
CREATE POLICY tracking_read ON tracking_events FOR SELECT
  USING (trip_id IN (
    SELECT id FROM trips WHERE carrier_id = auth.uid()
    UNION
    SELECT t.id FROM trips t JOIN loads l ON t.load_id = l.id WHERE l.shipper_id = auth.uid()
  ));
CREATE POLICY tracking_insert ON tracking_events FOR INSERT
  WITH CHECK (trip_id IN (SELECT id FROM trips WHERE carrier_id = auth.uid()));

-- Reviews: anyone can read, trip participants can write
CREATE POLICY reviews_read ON reviews FOR SELECT USING (true);
CREATE POLICY reviews_insert ON reviews FOR INSERT
  WITH CHECK (reviewer_id = auth.uid());

-- Allow shippers to update trips they own (for delivery confirmation)
CREATE POLICY trips_shipper_confirm ON trips FOR UPDATE
  USING (load_id IN (SELECT id FROM loads WHERE shipper_id = auth.uid()));

-- ============================================================
-- 12. Enable Realtime for key tables
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE loads;
ALTER PUBLICATION supabase_realtime ADD TABLE bids;
ALTER PUBLICATION supabase_realtime ADD TABLE trips;
ALTER PUBLICATION supabase_realtime ADD TABLE tracking_events;
