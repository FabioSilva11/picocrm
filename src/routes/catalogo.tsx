import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { catalog, normalize } from "@/lib/catalog";

export const Route = createFileRoute("/catalogo")({
  head: () => ({
    meta: [
      { title: "Catálogo • DOMINA CRM" },
      { name: "description", content: "Explore todos os itens do catálogo DOMINA: ventiladores, motores e estoque." },
    ],
  }),
  component: Catalogo,
});

const sourceTone: Record<string, string> = {
  Ventilador: "bg-primary/10 text-primary",
  Motor: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  Estoque: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
};

function Catalogo() {
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("");

  const items = useMemo(() => {
    const q = normalize(search);
    return catalog.catalogItems.filter((item) => {
      if (source && item.Fonte !== source) return false;
      if (!q) return true;
      return (
        normalize(item.Codigo).includes(q) ||
        normalize(item.Descricao).includes(q) ||
        normalize(item.Categoria).includes(q) ||
        normalize(item.Cor).includes(q) ||
        normalize(item.Tensao).includes(q)
      );
    });
  }, [search, source]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Catálogo</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Todos os itens</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {catalog.summary.allProducts} itens em {catalog.filters.sources.length} origens.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar código, descrição, cor..."
          className="input max-w-md flex-1"
        />
        <select value={source} onChange={(e) => setSource(e.target.value)} className="input w-56">
          <option value="">Todas as origens</option>
          {catalog.filters.sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="ml-auto rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
          {items.length} resultados
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border bg-surface shadow-sm">
        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-surface text-xs uppercase tracking-wide text-muted-foreground">
              <tr className="border-b">
                <th className="px-4 py-3">Origem</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const details = [
                  item.Tamanho ? `${item.Tamanho} cm` : "",
                  item.Tensao,
                  item.Cor,
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <tr key={`${item.Fonte}-${item.Codigo}`} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          sourceTone[item.Fonte] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.Fonte}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground tabular-nums">{item.Codigo}</td>
                    <td className="px-4 py-2 font-medium">{item.Descricao}</td>
                    <td className="px-4 py-2 text-muted-foreground">{item.Categoria || "-"}</td>
                    <td className="px-4 py-2 text-muted-foreground">{details || "-"}</td>
                  </tr>
                );
              })}
              {!items.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum item corresponde aos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
