-- Fix: carriers can't see load data after bid is accepted
-- loads_public only allows SELECT on 'posted'/'bidding' loads
-- loads_shipper only allows the shipper
-- Result: carrier's trip view shows null load data (", -> ,")

-- Allow carriers to see loads they've bid on (any status)
CREATE POLICY loads_carrier_via_bid ON loads FOR SELECT
  USING (id IN (SELECT load_id FROM bids WHERE carrier_id = auth.uid()));

-- Allow carriers to see loads linked to their trips
CREATE POLICY loads_carrier_via_trip ON loads FOR SELECT
  USING (id IN (SELECT load_id FROM trips WHERE carrier_id = auth.uid()));
