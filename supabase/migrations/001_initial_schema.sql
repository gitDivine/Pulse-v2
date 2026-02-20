-- PULSE Database Schema — Phase 1 (FLOW)
-- All money values stored in kobo (₦1 = 100 kobo)

-- Enums
CREATE TYPE user_role AS ENUM ('seller', 'buyer', 'carrier');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'payment_sent', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled', 'disputed');
CREATE TYPE dispute_status AS ENUM ('open', 'evidence', 'review', 'resolved', 'closed');
CREATE TYPE notification_priority AS ENUM ('critical', 'normal', 'low');
CREATE TYPE verification_level AS ENUM ('phone', 'bvn_nin', 'cac');

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'seller',
  phone TEXT,
  email TEXT,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  verification_level verification_level NOT NULL DEFAULT 'phone',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Businesses (seller storefronts)
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  address TEXT,
  city TEXT,
  state TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  phone TEXT,
  email TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_businesses_owner ON businesses(owner_id);
CREATE INDEX idx_businesses_slug ON businesses(slug);
CREATE INDEX idx_businesses_city_state ON businesses(city, state);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price BIGINT NOT NULL,
  compare_at_price BIGINT,
  images TEXT[] NOT NULL DEFAULT '{}',
  category TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_business ON products(business_id);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES profiles(id),
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  buyer_email TEXT,
  delivery_address TEXT NOT NULL,
  delivery_city TEXT,
  delivery_state TEXT,
  delivery_latitude DOUBLE PRECISION,
  delivery_longitude DOUBLE PRECISION,
  status order_status NOT NULL DEFAULT 'pending',
  subtotal BIGINT NOT NULL DEFAULT 0,
  delivery_fee BIGINT NOT NULL DEFAULT 0,
  total BIGINT NOT NULL DEFAULT 0,
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_business ON orders(business_id);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);

-- Generate order number: PLS-YYYYMMDD-XXXXX
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  daily_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO daily_count
  FROM orders
  WHERE DATE(created_at) = CURRENT_DATE;

  NEW.order_number := 'PLS-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(daily_count::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price BIGINT NOT NULL,
  total_price BIGINT NOT NULL
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Conversations (buyer-seller chat)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  buyer_identifier TEXT NOT NULL,
  buyer_name TEXT,
  channel TEXT NOT NULL DEFAULT 'web',
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversations_business ON conversations(business_id);
CREATE UNIQUE INDEX idx_conversations_business_buyer ON conversations(business_id, buyer_identifier);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('buyer', 'seller', 'ai')),
  content TEXT NOT NULL,
  metadata JSONB,
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  priority notification_priority NOT NULL DEFAULT 'normal',
  is_read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE NOT is_read;

-- Disputes
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES profiles(id),
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_urls TEXT[] NOT NULL DEFAULT '{}',
  status dispute_status NOT NULL DEFAULT 'open',
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_disputes_order ON disputes(order_id);

-- Addresses (SCOUT foundation)
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_address TEXT NOT NULL,
  parsed_address TEXT,
  landmark TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  confidence_score REAL NOT NULL DEFAULT 0,
  delivery_notes TEXT,
  delivery_count INTEGER NOT NULL DEFAULT 0,
  failed_delivery_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_addresses_city_state ON addresses(city, state);
CREATE INDEX idx_addresses_raw ON addresses USING gin(to_tsvector('english', raw_address));

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: users can read/update their own profile
CREATE POLICY profiles_select ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Businesses: owners manage, public can view published
CREATE POLICY businesses_owner ON businesses FOR ALL USING (owner_id = auth.uid());
CREATE POLICY businesses_public ON businesses FOR SELECT USING (is_published = true);

-- Products: business owners manage, public can view published
CREATE POLICY products_owner ON products FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
CREATE POLICY products_public ON products FOR SELECT
  USING (is_published = true AND business_id IN (SELECT id FROM businesses WHERE is_published = true));

-- Orders: business owners see their orders, buyers see their own
CREATE POLICY orders_business ON orders FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
CREATE POLICY orders_buyer ON orders FOR SELECT USING (buyer_id = auth.uid());

-- Order items: follow order access
CREATE POLICY order_items_access ON order_items FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()) OR buyer_id = auth.uid()));

-- Conversations: business owners only
CREATE POLICY conversations_owner ON conversations FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Messages: accessible via conversation access
CREATE POLICY messages_access ON messages FOR SELECT
  USING (conversation_id IN (SELECT id FROM conversations WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())));
CREATE POLICY messages_insert ON messages FOR INSERT WITH CHECK (true);

-- Notifications: own only
CREATE POLICY notifications_own ON notifications FOR ALL USING (user_id = auth.uid());

-- Disputes: participants only
CREATE POLICY disputes_access ON disputes FOR ALL
  USING (opened_by = auth.uid() OR order_id IN (SELECT id FROM orders WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())));

-- Addresses: public read, authenticated write
CREATE POLICY addresses_read ON addresses FOR SELECT USING (true);
CREATE POLICY addresses_write ON addresses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY addresses_update ON addresses FOR UPDATE USING (auth.uid() IS NOT NULL);
