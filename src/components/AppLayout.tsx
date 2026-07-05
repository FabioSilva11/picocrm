import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { catalog } from "@/lib/catalog";
import { Calculator, LayoutDashboard, PackageSearch, Truck } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Painel", icon: LayoutDashboard },
  { to: "/calculadora", label: "Calculadora", icon: Calculator },
  { to: "/carga", label: "Carga", icon: Truck },
  { to: "/catalogo", label: "Catálogo", icon: PackageSearch },
] as const;

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-right">
      <p className="text-[10px] uppercase tracking-wider text-white/60">{label}</p>
      <p className="text-lg font-black leading-tight">{value}</p>
    </div>
  );
}

export function AppLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const s = catalog.summary;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="screen-only fixed inset-y-0 left-0 hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">DOMINA</p>
          <h1 className="mt-1 text-xl font-black leading-tight">CRM de Peças</h1>
          <p className="mt-1 text-xs text-white/60">Calculadora automática</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? path === "/" : path.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-3">
          <Stat label="Calc." value={s.calculableProducts} />
          <Stat label="Motores" value={s.motors} />
          <Stat label="Estoque" value={s.stockItems} />
          <Stat label="Carga" value={s.loadProducts} />
        </div>
      </aside>

      <header className="screen-only sticky top-0 z-10 flex items-center justify-between border-b bg-surface px-4 py-3 lg:hidden">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">DOMINA</p>
          <h1 className="text-sm font-black">CRM de Peças</h1>
        </div>
        <nav className="flex gap-1">
          {nav.map(({ to, icon: Icon, label }) => {
            const active = to === "/" ? path === "/" : path.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                aria-label={label}
                className={`rounded-md p-2 ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                <Icon className="h-4 w-4" />
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="screen-only lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <div id="printArea" className="print-only" />
    </div>
  );
}
