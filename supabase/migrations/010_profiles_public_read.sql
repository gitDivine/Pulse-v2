-- Allow all authenticated users to read any profile
-- This is standard for a marketplace where users need to see counterparty info
-- (shipper sees carrier name/rating, carrier sees shipper name/phone, etc.)
-- Multiple SELECT policies are OR'd together in PostgreSQL RLS.

CREATE POLICY profiles_read_authenticated
  ON profiles FOR SELECT
  TO authenticated
  USING (true);
