
-- ================= PRODUCTS =================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  tipo_base TEXT NOT NULL DEFAULT '',
  categoria TEXT NOT NULL DEFAULT '',
  tamanho INTEGER,
  tensao TEXT NOT NULL DEFAULT '',
  cor TEXT,
  motor_codigo TEXT,
  motor_descricao TEXT,
  observacoes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products all" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ================= PRODUCT COMPONENTS =================
CREATE TABLE public.product_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL DEFAULT '',
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_components TO anon, authenticated;
GRANT ALL ON public.product_components TO service_role;
ALTER TABLE public.product_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_components all" ON public.product_components FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_pc_product ON public.product_components(product_id);
CREATE INDEX idx_pc_code ON public.product_components(code);

-- ================= STOCK =================
CREATE TABLE public.stock (
  item_code TEXT PRIMARY KEY,
  description TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock TO anon, authenticated;
GRANT ALL ON public.stock TO service_role;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock all" ON public.stock FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER stock_updated BEFORE UPDATE ON public.stock FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movements TO anon, authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock_movements all" ON public.stock_movements FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_sm_item ON public.stock_movements(item_code);
CREATE INDEX idx_sm_created ON public.stock_movements(created_at DESC);

-- Function: apply a movement and update stock atomically
CREATE OR REPLACE FUNCTION public.apply_stock_movement(
  _item_code TEXT,
  _description TEXT,
  _delta INTEGER,
  _reason TEXT,
  _ref TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  mov_id UUID;
BEGIN
  INSERT INTO public.stock (item_code, description, quantity)
  VALUES (_item_code, COALESCE(_description,''), _delta)
  ON CONFLICT (item_code) DO UPDATE
    SET quantity = public.stock.quantity + _delta,
        description = COALESCE(NULLIF(EXCLUDED.description,''), public.stock.description),
        updated_at = now();

  INSERT INTO public.stock_movements (item_code, description, delta, reason, ref)
  VALUES (_item_code, COALESCE(_description,''), _delta, COALESCE(_reason,''), _ref)
  RETURNING id INTO mov_id;

  RETURN mov_id;
END;
$$;

-- ================= PRODUCTION ORDERS =================
CREATE TABLE public.production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'rascunho',
  notes TEXT NOT NULL DEFAULT '',
  total_units INTEGER NOT NULL DEFAULT 0,
  total_pieces INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_orders TO anon, authenticated;
GRANT ALL ON public.production_orders TO service_role;
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "production_orders all" ON public.production_orders FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER production_orders_updated BEFORE UPDATE ON public.production_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.production_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  product_code TEXT NOT NULL,
  product_description TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_order_items TO anon, authenticated;
GRANT ALL ON public.production_order_items TO service_role;
ALTER TABLE public.production_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "production_order_items all" ON public.production_order_items FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_poi_order ON public.production_order_items(order_id);

-- ================= CUSTOMERS =================
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO anon, authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers all" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER customers_updated BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ================= SALES ORDERS =================
CREATE TABLE public.sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'rascunho',
  notes TEXT NOT NULL DEFAULT '',
  total_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_orders TO anon, authenticated;
GRANT ALL ON public.sales_orders TO service_role;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_orders all" ON public.sales_orders FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER sales_orders_updated BEFORE UPDATE ON public.sales_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.sales_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  product_code TEXT NOT NULL,
  product_description TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_cents INTEGER NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_order_items TO anon, authenticated;
GRANT ALL ON public.sales_order_items TO service_role;
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_order_items all" ON public.sales_order_items FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_soi_order ON public.sales_order_items(order_id);
