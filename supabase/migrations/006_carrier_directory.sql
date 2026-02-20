-- Carrier Directory: favorites, bid invitations, carrier profile visibility

-- 1. Favorites table
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  carrier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_favorites_pair ON favorites(shipper_id, carrier_id);
CREATE INDEX idx_favorites_shipper ON favorites(shipper_id);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY favorites_shipper ON favorites
  FOR ALL USING (shipper_id = auth.uid());

-- 2. Bid invitations table
CREATE TYPE invitation_status AS ENUM ('pending', 'viewed', 'bid_placed', 'expired');

CREATE TABLE bid_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  shipper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  carrier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status invitation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_invitations_load_carrier ON bid_invitations(load_id, carrier_id);
CREATE INDEX idx_invitations_carrier ON bid_invitations(carrier_id);
CREATE INDEX idx_invitations_shipper ON bid_invitations(shipper_id);

ALTER TABLE bid_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY invitations_shipper ON bid_invitations
  FOR ALL USING (shipper_id = auth.uid());

CREATE POLICY invitations_carrier_select ON bid_invitations
  FOR SELECT USING (carrier_id = auth.uid());

CREATE POLICY invitations_carrier_update ON bid_invitations
  FOR UPDATE USING (carrier_id = auth.uid());

-- updated_at trigger (reuses existing update_updated_at function)
CREATE TRIGGER update_bid_invitations_updated_at
  BEFORE UPDATE ON bid_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. Auto-update invitation when carrier places a bid
CREATE OR REPLACE FUNCTION update_invitation_on_bid()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE bid_invitations
  SET status = 'bid_placed'
  WHERE load_id = NEW.load_id
    AND carrier_id = NEW.carrier_id
    AND status IN ('pending', 'viewed');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_bid_update_invitation
  AFTER INSERT ON bids
  FOR EACH ROW
  EXECUTE FUNCTION update_invitation_on_bid();

-- 4. Carrier profile visibility — any authenticated user can browse carriers
CREATE POLICY profiles_carriers_public ON profiles
  FOR SELECT USING (role = 'carrier'::user_role);
