-- Fix: triggers that update across tables need SECURITY DEFINER to bypass RLS
-- Without this, the carrier who places a bid can't update the load's bid_count

CREATE OR REPLACE FUNCTION increment_bid_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE loads SET bid_count = bid_count + 1, status = 'bidding'
  WHERE id = NEW.load_id AND status = 'posted';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
