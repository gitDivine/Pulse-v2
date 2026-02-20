-- Fix: 004 policies caused infinite RLS recursion
-- loads policy queries bids -> bids policy queries loads -> loop
-- Solution: SECURITY DEFINER function bypasses RLS on bids/trips tables

-- Drop the recursive policies
DROP POLICY IF EXISTS loads_carrier_via_bid ON loads;
DROP POLICY IF EXISTS loads_carrier_via_trip ON loads;

-- Create a function that queries bids+trips without triggering their RLS
CREATE OR REPLACE FUNCTION get_carrier_load_ids(user_id UUID)
RETURNS SETOF UUID
SECURITY DEFINER
SET search_path = public
STABLE
LANGUAGE sql
AS $$
  SELECT load_id FROM bids WHERE carrier_id = user_id
  UNION
  SELECT load_id FROM trips WHERE carrier_id = user_id;
$$;

-- Single policy using the safe function
CREATE POLICY loads_carrier_access ON loads FOR SELECT
  USING (id IN (SELECT get_carrier_load_ids(auth.uid())));
