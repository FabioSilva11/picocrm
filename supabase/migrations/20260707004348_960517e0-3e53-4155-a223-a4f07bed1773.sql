
CREATE TABLE public.catalog_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fonte TEXT NOT NULL DEFAULT 'Estoque',
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT '',
  tamanho INTEGER,
  tensao TEXT NOT NULL DEFAULT '',
  cor TEXT,
  calculavel TEXT NOT NULL DEFAULT 'Nao',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_items TO anon, authenticated;
GRANT ALL ON public.catalog_items TO service_role;

ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read catalog" ON public.catalog_items FOR SELECT USING (true);
CREATE POLICY "Public insert catalog" ON public.catalog_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update catalog" ON public.catalog_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete catalog" ON public.catalog_items FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_catalog_items_updated_at
BEFORE UPDATE ON public.catalog_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_catalog_items_fonte ON public.catalog_items(fonte);
CREATE INDEX idx_catalog_items_codigo ON public.catalog_items(codigo);
