-- Migration: Add is_discoverable column to profiles
-- Carriers can hide themselves from the shipper directory

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_discoverable BOOLEAN NOT NULL DEFAULT true;

-- Index for directory queries (only show discoverable carriers)
CREATE INDEX IF NOT EXISTS idx_profiles_discoverable
  ON profiles (role, is_discoverable)
  WHERE role = 'carrier' AND is_discoverable = true;
