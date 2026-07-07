import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Calculator,
  LayoutDashboard,
  PackageSearch,
  Truck,
} from "lucide-react";

const nav = [
  { to: "/", label: "Painel", icon: LayoutDashboard },
  { to: "/calculadora", label: "Calculadora", icon: Calculator },
  { to: "/carga", label: "Carga", icon: Truck },
  { to: "/catalogo", label: "Catálogo", icon: PackageSearch },
] as const;

export function AppLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="screen-only fixed inset-y-0 left-0 hidden w-60 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">DOMINA</p>
          <h1 className="mt-1 text-xl font-black leading-tight">CRM de Peças</h1>
          <p className="mt-1 text-xs text-white/60">Calculadora e gestão de peças</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
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
      </aside>

      <header className="screen-only sticky top-0 z-10 flex items-center justify-between border-b bg-surface px-4 py-3 lg:hidden">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">DOMINA</p>
          <h1 className="text-sm font-black">CRM de Peças</h1>
        </div>
        <nav className="flex flex-wrap gap-1">
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

      <main className="screen-only lg:pl-60">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <div id="printArea" className="print-only" />
    </div>
  );
}
