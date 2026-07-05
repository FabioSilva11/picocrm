import { createFileRoute, Link } from "@tanstack/react-router";
import { catalog } from "@/lib/catalog";
import { Calculator, PackageSearch, Truck, Boxes, Zap, Warehouse, Layers } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel • DOMINA CRM de Peças" },
      { name: "description", content: "Visão geral do catálogo DOMINA: ventiladores, motores, estoque e carga." },
    ],
  }),
  component: Dashboard,
});

const cards = [
  { label: "Produtos calculáveis", key: "calculableProducts", icon: Calculator, tone: "bg-primary/10 text-primary" },
  { label: "Motores cadastrados", key: "motors", icon: Zap, tone: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  { label: "Itens de estoque", key: "stockItems", icon: Warehouse, tone: "bg-sky-500/10 text-sky-700 dark:text-sky-400" },
  { label: "Total no banco", key: "allProducts", icon: Layers, tone: "bg-violet-500/10 text-violet-700 dark:text-violet-400" },
  { label: "Itens na carga", key: "loadProducts", icon: Boxes, tone: "bg-rose-500/10 text-rose-700 dark:text-rose-400" },
] as const;

function Dashboard() {
  const s = catalog.summary;
  const byCategory = new Map<string, number>();
  for (const p of catalog.products) {
    byCategory.set(p.Categoria, (byCategory.get(p.Categoria) ?? 0) + 1);
  }
  const cats = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(...cats.map(([, v]) => v), 1);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Painel</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Visão geral do catálogo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Arquivo de carga: <span className="font-semibold">{catalog.load.sourceFile}</span>
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(({ label, key, icon: Icon, tone }) => (
          <div key={key} className="rounded-lg border bg-surface p-4 shadow-sm">
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${tone}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 text-3xl font-black tracking-tight">{s[key]}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-lg border bg-surface p-5 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold">Produtos por categoria</h2>
          <ul className="mt-4 space-y-3">
            {cats.map(([cat, count]) => (
              <li key={cat} className="text-sm">
                <div className="flex items-center justify-between font-medium">
                  <span>{cat}</span>
                  <span className="tabular-nums text-muted-foreground">{count}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(count / maxCat) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            to="/calculadora"
            className="group block rounded-lg border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <Calculator className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-bold">Calcular peças</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Escolha um ventilador e obtenha a lista de componentes.
            </p>
          </Link>
          <Link
            to="/carga"
            className="group block rounded-lg border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <Truck className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-bold">Calcular carga</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Consolide todas as peças da carga do dia.
            </p>
          </Link>
          <Link
            to="/catalogo"
            className="group block rounded-lg border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <PackageSearch className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-bold">Explorar catálogo</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Pesquise entre {s.allProducts} itens de todas as origens.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
