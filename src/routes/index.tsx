import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calculator, Truck, PackageSearch } from "lucide-react";
import { fetchProducts } from "@/lib/db";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Painel • DOMINA CRM" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: products = [] } = useQuery({ queryKey: ["products_full"], queryFn: fetchProducts });

  const byCategory = new Map<string, number>();
  for (const p of products) byCategory.set(p.categoria, (byCategory.get(p.categoria) ?? 0) + 1);
  const cats = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(...cats.map(([, v]) => v), 1);

  const cards = [
    { label: "Produtos", value: products.length, icon: Calculator, tone: "bg-primary/10 text-primary", to: "/calculadora" as const },
    { label: "Carga", icon: Truck, tone: "bg-sky-500/10 text-sky-700", to: "/carga" as const },
    { label: "Catálogo", icon: PackageSearch, tone: "bg-amber-500/10 text-amber-700", to: "/catalogo" as const },
  ];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Painel</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Visão geral</h1>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, tone, to }) => (
          <Link key={label} to={to} className="rounded-lg border bg-surface p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${tone}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            {value !== undefined && <p className="mt-1 text-3xl font-black tracking-tight">{value}</p>}
          </Link>
        ))}
      </section>

      <section className="grid gap-5">
        <div className="rounded-lg border bg-surface p-5 shadow-sm">
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
      </section>
    </div>
  );
}
