import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

// ============ TYPES ============
export interface DbProduct {
  id: string;
  codigo: string;
  descricao: string;
  tipo_base: string;
  categoria: string;
  tamanho: number | null;
  tensao: string;
  cor: string | null;
  motor_codigo: string | null;
  motor_descricao: string | null;
  observacoes: string[];
}

export interface DbComponent {
  id: string;
  product_id: string;
  group_name: string;
  code: string;
  description: string;
  quantity: number;
  position: number;
}

export interface ProductWithComponents extends DbProduct {
  components: DbComponent[];
}

export interface DbStock {
  item_code: string;
  description: string;
  quantity: number;
  min_quantity: number;
  updated_at: string;
}

export interface DbMovement {
  id: string;
  item_code: string;
  description: string;
  delta: number;
  reason: string;
  ref: string | null;
  created_at: string;
}

export interface DbCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface DbProductionOrder {
  id: string;
  name: string;
  status: string;
  notes: string;
  total_units: number;
  total_pieces: number;
  created_at: string;
  updated_at: string;
}

export interface DbProductionOrderItem {
  id: string;
  order_id: string;
  product_code: string;
  product_description: string;
  quantity: number;
}

export interface DbSalesOrder {
  id: string;
  customer_id: string | null;
  status: string;
  notes: string;
  total_cents: number;
  created_at: string;
  updated_at: string;
}

export interface DbSalesOrderItem {
  id: string;
  order_id: string;
  product_code: string;
  product_description: string;
  quantity: number;
  unit_price_cents: number;
}

// ============ SCHEMAS ============
export const catalogItemSchema = z.object({
  fonte: z.enum(["Ventilador", "Motor", "Estoque"]),
  codigo: z.string().trim().min(1, "Código obrigatório").max(64),
  descricao: z.string().trim().min(1, "Descrição obrigatória").max(200),
  categoria: z.string().trim().max(80).default(""),
  tamanho: z.number().int().nonnegative().nullable(),
  tensao: z.string().trim().max(20).default(""),
  cor: z.string().trim().max(60).nullable(),
  calculavel: z.enum(["Sim", "Nao"]).default("Nao"),
});

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório").max(120),
  email: z.string().trim().email("Email inválido").max(160).nullable().or(z.literal("").transform(() => null)),
  phone: z.string().trim().max(40).nullable().or(z.literal("").transform(() => null)),
  company: z.string().trim().max(160).nullable().or(z.literal("").transform(() => null)),
  notes: z.string().trim().max(2000).default(""),
});

// ============ QUERIES ============
export async function fetchProducts(): Promise<ProductWithComponents[]> {
  const [{ data: prods, error: e1 }, { data: comps, error: e2 }] = await Promise.all([
    supabase.from("products").select("*").order("codigo"),
    supabase.from("product_components").select("*").order("position"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  const compsByPid = new Map<string, DbComponent[]>();
  for (const c of (comps ?? []) as DbComponent[]) {
    const arr = compsByPid.get(c.product_id) ?? [];
    arr.push(c);
    compsByPid.set(c.product_id, arr);
  }
  return ((prods ?? []) as DbProduct[]).map((p) => ({
    ...p,
    components: compsByPid.get(p.id) ?? [],
  }));
}

export async function fetchStock(): Promise<DbStock[]> {
  const { data, error } = await supabase.from("stock").select("*").order("item_code");
  if (error) throw error;
  return (data ?? []) as DbStock[];
}

export async function fetchMovements(limit = 200): Promise<DbMovement[]> {
  const { data, error } = await supabase
    .from("stock_movements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as DbMovement[];
}

export async function applyMovement(
  item_code: string,
  description: string,
  delta: number,
  reason: string,
  ref: string | null = null,
) {
  const { error } = await supabase.rpc("apply_stock_movement", {
    _item_code: item_code,
    _description: description,
    _delta: delta,
    _reason: reason,
    _ref: ref,
  });
  if (error) throw error;
}

// ============ LOAD CALCULATION ============
export interface LoadPiece {
  group: string;
  code: string;
  description: string;
  quantity: number;
}

export interface LoadResult {
  products: (ProductWithComponents & { quantity: number })[];
  pieces: LoadPiece[];
  totalUnits: number;
  totalPieces: number;
}

export function calculateLoad(
  products: ProductWithComponents[],
  quantities: Record<string, number>,
): LoadResult {
  const map = new Map<string, LoadPiece>();
  const selected: LoadResult["products"] = [];
  let totalUnits = 0;
  for (const p of products) {
    const qty = Math.max(0, Number(quantities[p.codigo] ?? 0) | 0);
    if (!qty) continue;
    totalUnits += qty;
    selected.push({ ...p, quantity: qty });
    for (const c of p.components) {
      const k = `${c.group_name}|${c.code}|${c.description}`;
      const cur = map.get(k) ?? {
        group: c.group_name,
        code: c.code,
        description: c.description,
        quantity: 0,
      };
      cur.quantity += c.quantity * qty;
      map.set(k, cur);
    }
  }
  const pieces = [...map.values()].sort(
    (a, b) => a.group.localeCompare(b.group) || a.description.localeCompare(b.description),
  );
  return {
    products: selected,
    pieces,
    totalUnits,
    totalPieces: pieces.reduce((s, x) => s + x.quantity, 0),
  };
}

export function normalize(v: unknown): string {
  return (v ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
