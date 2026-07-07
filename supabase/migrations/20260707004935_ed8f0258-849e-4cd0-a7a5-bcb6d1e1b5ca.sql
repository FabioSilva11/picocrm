
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
