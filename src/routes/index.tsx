import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calculator, PackageSearch, Truck, ArrowRight, TrendingUp } from "lucide-react";
import { fetchProducts } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { typeTone } from "@/lib/badges";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Painel • DOMINA CRM" }] }),
  component: Dashboard,
});

const categoryColor: Record<string, string> = {
  Mesa:     "bg-violet-500",
  Parede:   "bg-sky-500",
  Coluna:   "bg-emerald-500",
  Practice: "bg-amber-500",
};

function Dashboard() {
  const { data: products = [] } = useQuery({
    queryKey: ["products_full"],
    queryFn: fetchProducts,
  });

  const { data: catalogCount = 0 } = useQuery({
    queryKey: ["count_catalog"],
    queryFn: async () => {
      const { count } = await supabase
        .from("catalog_items")
        .select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  // Agrupamentos
  const byCategory = new Map<string, number>();
  for (const p of products) byCategory.set(p.categoria, (byCategory.get(p.categoria) ?? 0) + 1);
  const cats = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(...cats.map(([, v]) => v), 1);

  const byTension = new Map<string, number>();
  for (const p of products) byTension.set(p.tensao, (byTension.get(p.tensao) ?? 0) + 1);
  const tensions = [...byTension.entries()].sort((a, b) => b[1] - a[1]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="space-y-8">

      {/* ── Cabeçalho ── */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Painel</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">{greeting}, DOMINA 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aqui está um resumo do seu catálogo e produtos.
          </p>
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </header>

      {/* ── Cards de métricas ── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Produtos */}
        <Link
          to="/calculadora"
          className="group relative overflow-hidden rounded-2xl border bg-surface p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Calculator className="h-6 w-6" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <p className="mt-4 text-4xl font-black tabular-nums tracking-tight">{products.length}</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">Produtos cadastrados</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Acesse a calculadora de peças</p>
        </Link>

        {/* Catálogo */}
        <Link
          to="/catalogo"
          className="group relative overflow-hidden rounded-2xl border bg-surface p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <PackageSearch className="h-6 w-6" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <p className="mt-4 text-4xl font-black tabular-nums tracking-tight">{catalogCount}</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">Itens no catálogo</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Ventiladores, motores e peças</p>
        </Link>

        {/* Carga — atalho rápido */}
        <Link
          to="/carga"
          className="group relative overflow-hidden rounded-2xl border bg-surface p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 sm:col-span-2 lg:col-span-1"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
              <Truck className="h-6 w-6" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <p className="mt-4 text-4xl font-black tracking-tight">→</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">Consolidação de carga</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Calcule peças para um lote</p>
        </Link>
      </section>

      {/* ── Linha inferior: Categorias + Tensões ── */}
      <section className="grid gap-5 lg:grid-cols-2">

        {/* Produtos por categoria */}
        <div className="rounded-2xl border bg-surface p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="font-bold">Produtos por tipo</h2>
          </div>
          {cats.length ? (
            <ul className="space-y-3">
              {cats.map(([cat, count]) => {
                const pct = Math.round((count / maxCat) * 100);
                const bar = categoryColor[cat] ?? "bg-primary";
                return (
                  <li key={cat}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${typeTone[cat] ?? "bg-muted text-muted-foreground border-border"}`}>
                        {cat}
                      </span>
                      <span className="tabular-nums font-bold">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum produto cadastrado.</p>
          )}
        </div>

        {/* Produtos por tensão */}
        <div className="rounded-2xl border bg-surface p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            <h2 className="font-bold">Produtos por tensão</h2>
          </div>
          {tensions.length ? (
            <ul className="space-y-4">
              {tensions.map(([tensao, count]) => {
                const pct = Math.round((count / products.length) * 100);
                const barColor =
                  tensao === "127V" ? "bg-blue-500"
                  : tensao === "220V" ? "bg-orange-500"
                  : "bg-teal-500";
                const labelColor =
                  tensao === "127V"
                    ? "bg-blue-500/10 text-blue-700 border-blue-300 dark:text-blue-400 dark:border-blue-700"
                    : tensao === "220V"
                    ? "bg-orange-500/10 text-orange-700 border-orange-300 dark:text-orange-400 dark:border-orange-700"
                    : "bg-teal-500/10 text-teal-700 border-teal-300 dark:text-teal-400 dark:border-teal-700";
                return (
                  <li key={tensao}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${labelColor}`}>
                        {tensao}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        <span className="font-bold text-foreground">{count}</span> · {pct}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum produto cadastrado.</p>
          )}
        </div>
      </section>
    </div>
  );
}
