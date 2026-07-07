import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Calculator,
  LayoutDashboard,
  PackageSearch,
  Truck,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const nav = [
  { to: "/", label: "Painel", icon: LayoutDashboard },
  { to: "/calculadora", label: "Calculadora", icon: Calculator },
  { to: "/carga", label: "Carga", icon: Truck },
  { to: "/catalogo", label: "Catálogo", icon: PackageSearch },
] as const;

function SidebarContent({ path, onClose }: { path: string; onClose?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-border px-5 py-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">DOMINA</p>
          <h1 className="mt-0.5 text-lg font-black leading-tight text-foreground">CRM de Peças</h1>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted lg:hidden">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Menu
        </p>
        {nav.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-md ${
                active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-5 py-4">
        <p className="text-[10px] text-muted-foreground">© 2025 Domina Ventiladores</p>
      </div>
    </div>
  );
}

export function AppLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Sidebar desktop ── */}
      <aside className="screen-only fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-sidebar shadow-sm lg:flex lg:flex-col">
        <SidebarContent path={path} />
      </aside>

      {/* ── Drawer mobile ── */}
      {mobileOpen && (
        <div className="screen-only fixed inset-0 z-40 lg:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Panel */}
          <aside className="absolute inset-y-0 left-0 w-64 bg-sidebar shadow-2xl">
            <SidebarContent path={path} onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Header mobile ── */}
      <header className="screen-only sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary leading-none">DOMINA</p>
            <p className="text-sm font-black leading-tight">CRM de Peças</p>
          </div>
        </div>
        {/* Nav ícones rápidos */}
        <nav className="flex gap-1">
          {nav.map(({ to, icon: Icon, label }) => {
            const active = to === "/" ? path === "/" : path.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                aria-label={label}
                className={`rounded-md p-2 transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
              </Link>
            );
          })}
        </nav>
      </header>

      {/* ── Conteúdo principal ── */}
      <main className="screen-only lg:pl-60">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <div id="printArea" className="print-only" />
    </div>
  );
}
