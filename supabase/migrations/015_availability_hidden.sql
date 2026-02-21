-- Migration: Add 'hidden' to availability status options
-- Carriers can hide their availability dot from shipper directory

-- Update check constraint to allow 'hidden'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS chk_availability_status;
ALTER TABLE profiles ADD CONSTRAINT chk_availability_status
  CHECK (availability_status IN ('available', 'busy', 'offline', 'hidden'));

-- Also refresh the PostgREST schema cache so it picks up
-- all recently added columns (availability_status, last_active_at, is_discoverable)
NOTIFY pgrst, 'reload schema';
