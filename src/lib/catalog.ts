import catalogData from "@/data/catalog.json";

export interface Component {
  group: string;
  code: string;
  description: string;
  quantity: number;
}

export interface Product {
  Codigo: string;
  Descricao: string;
  TipoBase: string;
  Categoria: string;
  Tamanho: number;
  Tensao: string;
  Cor?: string;
  Motor?: { Codigo: string; Descricao: string };
  Componentes: Component[];
  Observacoes: string[];
}

export interface CatalogItem {
  Fonte: string;
  Codigo: string;
  Descricao: string;
  Categoria: string;
  Tamanho: number | null;
  Tensao: string;
  Cor?: string;
  Calculavel: string;
}

export interface LoadItem {
  Linha: number;
  Codigo: string;
  Descricao: string;
  Quantidade: number;
  ProdutoEncontrado: string;
  Categoria?: string;
  Tamanho?: number | null;
  Tensao?: string;
  Cor?: string;
}

export interface Catalog {
  summary: {
    calculableProducts: number;
    motors: number;
    stockItems: number;
    allProducts: number;
    loadProducts: number;
    loadDefaultUnits: number;
  };
  filters: {
    categories: string[];
    sizes: number[];
    tensions: string[];
    colors: string[];
    sources: string[];
  };
  products: Product[];
  catalogItems: CatalogItem[];
  load: { sourceFile: string; products: LoadItem[] };
}

export const catalog = catalogData as unknown as Catalog;

export function normalize(value: unknown): string {
  return (value ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function findProduct(code: string): Product | undefined {
  return catalog.products.find((p) => p.Codigo === code);
}

export function aggregateComponents(product: Product, quantity: number): Component[] {
  return product.Componentes.map((c) => ({ ...c, quantity: c.quantity * quantity }));
}

export interface LoadResult {
  products: (LoadItem & { quantity: number; product?: Product })[];
  pieces: Component[];
  totalUnits: number;
  totalPieces: number;
}

export function calculateLoad(quantities: Record<string, number>): LoadResult {
  const pieces = new Map<string, Component>();
  const products: LoadResult["products"] = [];
  let totalUnits = 0;

  for (const item of catalog.load.products) {
    const quantity = Math.max(0, Number(quantities[item.Codigo] ?? 0) | 0);
    if (!quantity) continue;
    const product = findProduct(item.Codigo);
    totalUnits += quantity;
    products.push({ ...item, quantity, product });
    if (!product) continue;
    for (const c of product.Componentes) {
      const key = `${c.group}|${c.code}|${c.description}`;
      const cur = pieces.get(key) ?? { ...c, quantity: 0 };
      cur.quantity += c.quantity * quantity;
      pieces.set(key, cur);
    }
  }

  const consolidated = [...pieces.values()].sort(
    (a, b) => a.group.localeCompare(b.group) || a.description.localeCompare(b.description),
  );

  return {
    products,
    pieces: consolidated,
    totalUnits,
    totalPieces: consolidated.reduce((s, p) => s + p.quantity, 0),
  };
}
