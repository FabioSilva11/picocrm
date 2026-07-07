import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calculator, Truck, PackageSearch, Warehouse, Factory, Users, ShoppingCart, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchProducts, fetchStock } from "@/lib/db";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Painel • DOMINA CRM" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: products = [] } = useQuery({ queryKey: ["products_full"], queryFn: fetchProducts });
  const { data: stock = [] } = useQuery({ queryKey: ["stock"], queryFn: fetchStock });
  const { data: prodOrders = 0 } = useQuery({
    queryKey: ["count_prod"],
    queryFn: async () => (await supabase.from("production_orders").select("*", { count: "exact", head: true })).count ?? 0,
  });
  const { data: salesCount = 0 } = useQuery({
    queryKey: ["count_sales"],
    queryFn: async () => (await supabase.from("sales_orders").select("*", { count: "exact", head: true })).count ?? 0,
  });
  const { data: customersCount = 0 } = useQuery({
    queryKey: ["count_customers"],
    queryFn: async () => (await supabase.from("customers").select("*", { count: "exact", head: true })).count ?? 0,
  });

  const byCategory = new Map<string, number>();
  for (const p of products) byCategory.set(p.categoria, (byCategory.get(p.categoria) ?? 0) + 1);
  const cats = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(...cats.map(([, v]) => v), 1);

  const lowStock = stock.filter((s) => s.quantity < s.min_quantity);

  const cards = [
    { label: "Produtos", value: products.length, icon: Calculator, tone: "bg-primary/10 text-primary", to: "/calculadora" as const },
    { label: "SKUs em estoque", value: stock.length, icon: Warehouse, tone: "bg-sky-500/10 text-sky-700", to: "/estoque" as const },
    { label: "Ordens de produção", value: prodOrders, icon: Factory, tone: "bg-amber-500/10 text-amber-700", to: "/producao" as const },
    { label: "Clientes", value: customersCount, icon: Users, tone: "bg-violet-500/10 text-violet-700", to: "/clientes" as const },
    { label: "Vendas", value: salesCount, icon: ShoppingCart, tone: "bg-rose-500/10 text-rose-700", to: "/vendas" as const },
  ];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Painel</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Visão geral</h1>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(({ label, value, icon: Icon, tone, to }) => (
          <Link key={label} to={to} className="rounded-lg border bg-surface p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${tone}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 text-3xl font-black tracking-tight">{value}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-lg border bg-surface p-5 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold">Produtos por categoria</h2>
          <ul className="mt-4 space-y-3">
            {cats.map(([cat, count]) => (
              <li key={cat} className="text-sm">
                <div className="flex justify-between font-medium"><span>{cat}</span><span className="tabular-nums text-muted-foreground">{count}</span></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${(count / maxCat) * 100}%` }} />
                </div>
              </li>
            ))}
            {!cats.length && <li className="text-sm text-muted-foreground">Sem produtos.</li>}
          </ul>
        </div>

        <div className="rounded-lg border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-2 text-lg font-bold">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Estoque baixo
          </div>
          <ul className="mt-3 space-y-2 max-h-80 overflow-auto">
            {lowStock.map((s) => (
              <li key={s.item_code} className="flex justify-between text-sm rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">
                <div>
                  <p className="font-medium">{s.description || s.item_code}</p>
                  <p className="text-xs text-muted-foreground">{s.item_code}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-destructive tabular-nums">{s.quantity}</p>
                  <p className="text-xs text-muted-foreground">min: {s.min_quantity}</p>
                </div>
              </li>
            ))}
            {!lowStock.length && <li className="text-sm text-muted-foreground">Nenhum alerta.</li>}
          </ul>
          <Link to="/carga" className="mt-4 flex items-center justify-center gap-2 rounded-md bg-primary/10 py-2 text-sm font-bold text-primary hover:bg-primary/20">
            <Truck className="h-4 w-4" /> Ir para Carga
          </Link>
          <Link to="/catalogo" className="mt-2 flex items-center justify-center gap-2 rounded-md border py-2 text-sm font-bold hover:bg-muted">
            <PackageSearch className="h-4 w-4" /> Catálogo
          </Link>
        </div>
      </section>
    </div>
  );
}
