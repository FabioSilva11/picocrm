
-- Complete a production order: mark concluido and deduct components
CREATE OR REPLACE FUNCTION public.complete_production_order(_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  it RECORD;
  comp RECORD;
  pid uuid;
  cur_status text;
BEGIN
  SELECT status INTO cur_status FROM public.production_orders WHERE id = _order_id;
  IF cur_status IS NULL THEN RAISE EXCEPTION 'Ordem não encontrada'; END IF;
  IF cur_status = 'concluido' THEN RETURN; END IF;

  FOR it IN SELECT * FROM public.production_order_items WHERE order_id = _order_id LOOP
    SELECT id INTO pid FROM public.products WHERE codigo = it.product_code LIMIT 1;
    IF pid IS NOT NULL THEN
      FOR comp IN SELECT * FROM public.product_components WHERE product_id = pid LOOP
        PERFORM public.apply_stock_movement(
          comp.code,
          comp.description,
          -(comp.quantity * it.quantity)::int,
          'Produção concluída',
          _order_id::text
        );
      END LOOP;
    END IF;
  END LOOP;

  UPDATE public.production_orders SET status = 'concluido', updated_at = now() WHERE id = _order_id;
END;
$$;

-- Recalc sales order total from items
CREATE OR REPLACE FUNCTION public.recalc_sales_order_total(_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.sales_orders
  SET total_cents = COALESCE((
    SELECT SUM(quantity * unit_price_cents)::int FROM public.sales_order_items WHERE order_id = _order_id
  ), 0),
  updated_at = now()
  WHERE id = _order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_recalc_sales_order()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM public.recalc_sales_order_total(COALESCE(NEW.order_id, OLD.order_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sales_items_recalc ON public.sales_order_items;
CREATE TRIGGER trg_sales_items_recalc
AFTER INSERT OR UPDATE OR DELETE ON public.sales_order_items
FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_sales_order();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.catalog_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_movements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.production_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.production_order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_order_items;
