import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer, Loader2, X } from "lucide-react";
import { PrintArea, PrintHeader, usePrint } from "@/lib/print";
import { fetchProducts, normalize, type ProductWithComponents } from "@/lib/db";
import {
  typeTone, typeActiveTone,
  tensionTone, tensionActiveTone,
  defaultTone, defaultActiveTone,
} from "@/lib/badges";

export const Route = createFileRoute("/calculadora")({
  head: () => ({
    meta: [
      { title: "Calculadora • DOMINA CRM" },
      { name: "description", content: "Calcule peças necessárias para produzir um ventilador." },
    ],
  }),
  component: Calculadora,
});

function unique<T>(xs: T[]): T[] {
  return [...new Set(xs)].sort((a, b) => String(a).localeCompare(String(b)));
}

function Calculadora() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products_full"],
    queryFn: fetchProducts,
  });

  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState("");
  const [size, setSize]         = useState("");
  const [tension, setTension]   = useState("");
  const [color, setColor]       = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedCode, setSelectedCode] = useState<string>("");
  const print = usePrint();

  // Opções únicas derivadas do catálogo
  const filters = useMemo(() => ({
    categories: unique(products.map((p) => p.categoria).filter(Boolean)),
    sizes:      unique(products.map((p) => p.tamanho).filter((x): x is number => x != null)).map(String),
    tensions:   unique(products.map((p) => p.tensao).filter(Boolean)),
    colors:     unique(products.map((p) => p.cor ?? "").filter(Boolean)) as string[],
  }), [products]);

  // Produtos após todos os filtros
  const filtered = useMemo(() => {
    const q = normalize(search);
    return products.filter((p) => {
      if (q && !normalize(p.codigo).includes(q) && !normalize(p.descricao).includes(q)) return false;
      if (category && p.categoria !== category) return false;
      if (size && String(p.tamanho) !== size) return false;
      if (tension && p.tensao !== tension) return false;
      if (color && p.cor !== color) return false;
      return true;
    });
  }, [products, search, category, size, tension, color]);

  // Contagem por valor de filtro (sem aplicar aquele filtro) para mostrar nos chips
  const countBy = useMemo(() => {
    const base = (exclude: "cat" | "size" | "tension" | "color") =>
      products.filter((p) => {
        const q = normalize(search);
        if (q && !normalize(p.codigo).includes(q) && !normalize(p.descricao).includes(q)) return false;
        if (exclude !== "cat"     && category && p.categoria !== category) return false;
        if (exclude !== "size"    && size     && String(p.tamanho) !== size) return false;
        if (exclude !== "tension" && tension  && p.tensao !== tension) return false;
        if (exclude !== "color"   && color    && p.cor !== color) return false;
        return true;
      });
    return {
      category: (v: string) => base("cat").filter((p) => p.categoria === v).length,
      size:     (v: string) => base("size").filter((p) => String(p.tamanho) === v).length,
      tension:  (v: string) => base("tension").filter((p) => p.tensao === v).length,
      color:    (v: string) => base("color").filter((p) => p.cor === v).length,
    };
  }, [products, search, category, size, tension, color]);

  const hasFilters = category || size || tension || color;

  const selected: ProductWithComponents | undefined =
    filtered.find((p) => p.codigo === selectedCode) ?? filtered[0];

  const components = selected
    ? selected.components.map((c) => ({ ...c, quantity: c.quantity * quantity }))
    : [];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Calculadora</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Peças por ventilador</h1>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[400px_minmax(0,1fr)]">
          <aside className="space-y-5 rounded-lg border bg-surface p-5 shadow-sm">
            {/* Busca */}
            <Field label="Buscar ventilador">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Código ou descrição" className="input" />
            </Field>

            {/* Chips — Tipo (categoria) */}
            <div>
              <span className="mb-2 block text-sm font-semibold">
                Tipo
                {category && (
                  <button onClick={() => setCategory("")} className="ml-2 text-xs font-normal text-muted-foreground hover:text-destructive">
                    limpar
                  </button>
                )}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {filters.categories.map((cat) => {
                  const active  = category === cat;
                  const count   = countBy.category(cat);
                  const base    = typeTone[cat]       ?? defaultTone;
                  const activeC = typeActiveTone[cat] ?? defaultActiveTone;
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategory(active ? "" : cat)}
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${active ? activeC : base} ${count === 0 && !active ? "opacity-40" : ""}`}
                    >
                      {cat}
                      <span className={`rounded-full px-1 text-[10px] ${active ? "bg-white/20" : "bg-black/10 dark:bg-white/10"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chips — Tamanho */}
            <div>
              <span className="mb-2 block text-sm font-semibold">
                Tamanho
                {size && (
                  <button onClick={() => setSize("")} className="ml-2 text-xs font-normal text-muted-foreground hover:text-destructive">
                    limpar
                  </button>
                )}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {filters.sizes.map((s) => {
                  const active = size === s;
                  const count  = countBy.size(s);
                  return (
                    <button
                      key={s}
                      onClick={() => setSize(active ? "" : s)}
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${active ? defaultActiveTone : defaultTone} ${count === 0 && !active ? "opacity-40" : ""}`}
                    >
                      {s} cm
                      <span className={`rounded-full px-1 text-[10px] ${active ? "bg-white/20" : "bg-black/10 dark:bg-white/10"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chips — Tensão */}
            <div>
              <span className="mb-2 block text-sm font-semibold">
                Tensão
                {tension && (
                  <button onClick={() => setTension("")} className="ml-2 text-xs font-normal text-muted-foreground hover:text-destructive">
                    limpar
                  </button>
                )}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {filters.tensions.map((t) => {
                  const active  = tension === t;
                  const count   = countBy.tension(t);
                  const base    = tensionTone[t]       ?? defaultTone;
                  const activeC = tensionActiveTone[t] ?? defaultActiveTone;
                  return (
                    <button
                      key={t}
                      onClick={() => setTension(active ? "" : t)}
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${active ? activeC : base} ${count === 0 && !active ? "opacity-40" : ""}`}
                    >
                      {t}
                      <span className={`rounded-full px-1 text-[10px] ${active ? "bg-white/20" : "bg-black/10 dark:bg-white/10"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Select — Cor (muitas opções, mantém select) */}
            <Select label="Cor" value={color} onChange={setColor} options={filters.colors} allLabel="Todas as cores" />

            {/* Limpar todos os filtros */}
            {hasFilters && (
              <button
                onClick={() => { setCategory(""); setSize(""); setTension(""); setColor(""); }}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" /> Limpar todos os filtros
              </button>
            )}

            {/* Produto selecionado */}
            <Field label={`Produto final (${filtered.length})`}>
              <select value={selected?.codigo ?? ""} onChange={(e) => setSelectedCode(e.target.value)} className="input">
                {filtered.length ? (
                  filtered.map((p) => (
                    <option key={p.codigo} value={p.codigo}>
                      {p.codigo} — {p.descricao}
                    </option>
                  ))
                ) : (
                  <option value="">Nenhum produto</option>
                )}
              </select>
            </Field>

            {/* Quantidade */}
            <Field label="Quantidade">
              <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) | 0))} className="input" />
            </Field>

            <button
              onClick={print}
              disabled={!selected}
              className="flex w-full items-center justify-center gap-2 rounded-md border bg-surface px-4 py-2.5 text-sm font-bold hover:bg-muted disabled:opacity-50"
            >
              <Printer className="h-4 w-4" /> Imprimir lista
            </button>
          </aside>

          <section className="space-y-5">
            <article className="rounded-lg border bg-surface p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Selecionado</p>
                  <h2 className="mt-1 text-xl font-black">{selected?.descricao ?? "—"}</h2>
                  {selected && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">{selected.codigo}</span>
                      {selected.categoria && (
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${typeTone[selected.categoria] ?? defaultTone}`}>
                          {selected.categoria}
                        </span>
                      )}
                      {selected.tamanho && (
                        <span className="inline-flex rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                          {selected.tamanho} cm
                        </span>
                      )}
                      {selected.tensao && (
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${tensionTone[selected.tensao] ?? defaultTone}`}>
                          {selected.tensao}
                        </span>
                      )}
                      {selected.cor && (
                        <span className="inline-flex rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                          {selected.cor}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="rounded-md border border-primary/30 bg-primary/10 px-4 py-2 text-right">
                  <p className="text-xs font-semibold text-primary">Quantidade</p>
                  <p className="text-2xl font-black text-primary">{quantity}x</p>
                </div>
              </div>
            </article>

            <article className="rounded-lg border bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-base font-bold">Peças necessárias</h3>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {components.length} itens
                </span>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                    <tr className="border-b">
                      <th className="py-2 pr-4">Grupo</th>
                      <th className="py-2 pr-4">Código</th>
                      <th className="py-2 pr-4">Descrição</th>
                      <th className="py-2 text-right">Qtd</th>
                    </tr>
                  </thead>
                  <tbody>
                    {components.map((c) => (
                      <tr key={c.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-semibold text-primary">{c.group_name}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{c.code}</td>
                        <td className="py-2 pr-4">{c.description}</td>
                        <td className="py-2 text-right font-bold tabular-nums">{c.quantity}</td>
                      </tr>
                    ))}
                    {!components.length && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-muted-foreground">
                          Selecione um produto.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            {selected?.observacoes.length ? (
              <article className="rounded-lg border bg-surface p-5 shadow-sm">
                <h3 className="text-base font-bold">Observações</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {selected.observacoes.map((n, i) => (
                    <li key={i} className="rounded-md border border-warn bg-warn px-3 py-2 text-warn-foreground">
                      {n}
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}
          </section>
        </div>
      )}

      {selected && (
        <PrintArea>
          <PrintHeader title="Lista de peças" />
          <h2 style={{ fontSize: 18, margin: "0 0 6px" }}>{selected.descricao}</h2>
          <p style={{ margin: 0, fontSize: 13 }}>
            Código: <strong>{selected.codigo}</strong> · Quantidade: <strong>{quantity}</strong>
          </p>
          <table className="print-table" style={{ marginTop: 16 }}>
            <thead>
              <tr><th>Grupo</th><th>Código</th><th>Descrição</th><th style={{ textAlign: "right" }}>Qtd</th></tr>
            </thead>
            <tbody>
              {components.map((c) => (
                <tr key={c.id}>
                  <td>{c.group_name}</td>
                  <td>{c.code}</td>
                  <td>{c.description}</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{c.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </PrintArea>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

function Select({
  label, value, onChange, options, allLabel,
}: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; allLabel: string;
}) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input">
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </Field>
  );
}
