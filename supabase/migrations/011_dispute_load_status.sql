-- When a dispute is filed, also mark the load as 'disputed'
-- (previously only the trip status was updated)

CREATE OR REPLACE FUNCTION set_trip_disputed()
RETURNS TRIGGER SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE trips SET status = 'disputed' WHERE id = NEW.trip_id;
  UPDATE loads SET status = 'disputed' WHERE id = NEW.load_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
