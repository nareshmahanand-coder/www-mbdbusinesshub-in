
-- Merchant profiles table
CREATE TABLE public.merchant_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_name text NOT NULL DEFAULT '',
  shop_name_hindi text DEFAULT '',
  category text DEFAULT '',
  description text DEFAULT '',
  address text DEFAULT '',
  city text DEFAULT '',
  pincode text DEFAULT '',
  phone text DEFAULT '',
  whatsapp text DEFAULT '',
  latitude double precision,
  longitude double precision,
  photos text[] DEFAULT '{}',
  is_premium boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  premium_plan text,
  premium_start_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.merchant_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own merchant profile" ON public.merchant_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own merchant profile" ON public.merchant_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own merchant profile" ON public.merchant_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all merchant profiles" ON public.merchant_profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone authenticated can view verified merchants" ON public.merchant_profiles FOR SELECT TO authenticated USING (is_verified = true);

-- Products table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid REFERENCES public.merchant_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  name_hindi text DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  description text DEFAULT '',
  image_url text DEFAULT '',
  in_stock boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchant can manage own products" ON public.products FOR ALL TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT TO authenticated USING (true);

-- Saved shops table
CREATE TABLE public.saved_shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, shop_id)
);

ALTER TABLE public.saved_shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved shops" ON public.saved_shops FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Orders / inquiries table
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  merchant_id uuid REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  shop_id text,
  shop_name text DEFAULT '',
  status text DEFAULT 'inquiry',
  message text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own orders" ON public.orders FOR ALL TO authenticated USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Merchants can view their orders" ON public.orders FOR SELECT TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()));

-- Shop analytics table
CREATE TABLE public.shop_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid REFERENCES public.merchant_profiles(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own analytics" ON public.shop_analytics FOR SELECT TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchant_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Anyone can insert analytics" ON public.shop_analytics FOR INSERT TO authenticated WITH CHECK (true);
