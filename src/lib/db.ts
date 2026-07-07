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
