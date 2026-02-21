-- 012: Carrier availability status
-- Allows carriers to set their availability (available, busy, offline)
-- Shippers can filter carriers by availability in the directory

-- Add availability columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT 'offline',
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- Add check constraint for valid statuses
ALTER TABLE profiles
  ADD CONSTRAINT chk_availability_status
  CHECK (availability_status IN ('available', 'busy', 'offline'));

-- Index for filtering carriers by availability
CREATE INDEX IF NOT EXISTS idx_profiles_availability
  ON profiles(availability_status) WHERE role = 'carrier';

-- Auto-set carrier to 'busy' when a trip starts (pickup)
-- Auto-set carrier back to 'available' when trip is confirmed
CREATE OR REPLACE FUNCTION update_carrier_availability_on_trip()
RETURNS TRIGGER SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('pickup', 'in_transit') AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    UPDATE profiles
      SET availability_status = 'busy', last_active_at = now()
      WHERE id = NEW.carrier_id AND availability_status = 'available';
  ELSIF NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM NEW.status THEN
    UPDATE profiles
      SET availability_status = 'available', last_active_at = now()
      WHERE id = NEW.carrier_id AND availability_status = 'busy';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_carrier_availability ON trips;
CREATE TRIGGER trg_carrier_availability
  AFTER UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_carrier_availability_on_trip();
