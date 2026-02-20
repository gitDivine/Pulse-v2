-- Fix: bid_count only incremented on first bid because trigger required status = 'posted'
-- After first bid, status changes to 'bidding', so subsequent bids didn't increment

-- 1. Fix the trigger function
CREATE OR REPLACE FUNCTION increment_bid_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE loads SET
    bid_count = bid_count + 1,
    status = 'bidding'
  WHERE id = NEW.load_id AND status IN ('posted', 'bidding');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Recalculate bid_count for all existing loads from actual bid data
UPDATE loads SET bid_count = sub.actual_count
FROM (
  SELECT load_id, COUNT(*) AS actual_count
  FROM bids
  WHERE status != 'withdrawn'
  GROUP BY load_id
) sub
WHERE loads.id = sub.load_id AND loads.bid_count != sub.actual_count;
