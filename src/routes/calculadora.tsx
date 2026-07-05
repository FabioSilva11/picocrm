import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { catalog, aggregateComponents, normalize, type Product } from "@/lib/catalog";
import { PrintArea, PrintHeader, usePrint } from "@/lib/print";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/calculadora")({
  head: () => ({
    meta: [
      { title: "Calculadora • DOMINA CRM" },
      { name: "description", content: "Calcule as peças necessárias para produzir um ventilador DOMINA." },
    ],
  }),
  component: Calculadora,
});

function Calculadora() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [size, setSize] = useState("");
  const [tension, setTension] = useState("");
  const [color, setColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedCode, setSelectedCode] = useState<string>(catalog.products[0]?.Codigo ?? "");
  const print = usePrint();

  const filtered = useMemo<Product[]>(() => {
    const q = normalize(search);
    return catalog.products.filter((p) => {
      if (q && !normalize(p.Codigo).includes(q) && !normalize(p.Descricao).includes(q)) return false;
      if (category && p.Categoria !== category) return false;
      if (size && String(p.Tamanho) !== size) return false;
      if (tension && p.Tensao !== tension) return false;
      if (color && p.Cor !== color) return false;
      return true;
    });
  }, [search, category, size, tension, color]);

  const selected = useMemo(
    () => filtered.find((p) => p.Codigo === selectedCode) ?? filtered[0],
    [filtered, selectedCode],
  );

  const components = selected ? aggregateComponents(selected, quantity) : [];
  const notes = selected?.Observacoes.length
    ? selected.Observacoes
    : ["Cálculo gerado automaticamente com base nas planilhas importadas."];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Calculadora</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Peças por ventilador</h1>
      </header>

      <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="space-y-4 rounded-lg border bg-surface p-5 shadow-sm">
          <Field label="Buscar ventilador">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Código ou descrição"
              className="input"
            />
          </Field>

          <Field label="Produto final">
            <select
              value={selected?.Codigo ?? ""}
              onChange={(e) => setSelectedCode(e.target.value)}
              className="input"
            >
              {filtered.length ? (
                filtered.map((p) => (
                  <option key={p.Codigo} value={p.Codigo}>
                    {p.Codigo} — {p.Descricao}
                  </option>
                ))
              ) : (
                <option value="">Nenhum produto encontrado</option>
              )}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Select label="Categoria" value={category} onChange={setCategory} options={catalog.filters.categories} allLabel="Todas" />
            <Select label="Tamanho" value={size} onChange={setSize} options={catalog.filters.sizes.map(String)} format={(v) => `${v} cm`} allLabel="Todos" />
            <Select label="Tensão" value={tension} onChange={setTension} options={catalog.filters.tensions} allLabel="Todas" />
            <Select label="Cor" value={color} onChange={setColor} options={catalog.filters.colors} allLabel="Todas" />
          </div>

          <Field label="Quantidade">
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) | 0))}
              className="input"
            />
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
                <h2 className="mt-1 text-xl font-black">{selected?.Descricao ?? "Nenhum produto"}</h2>
                {selected && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selected.Codigo} · {selected.Categoria} · {selected.Tamanho} cm · {selected.Tensao}
                    {selected.Cor ? ` · ${selected.Cor}` : ""}
                  </p>
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
                  {components.map((c, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-semibold text-primary">{c.group}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{c.code}</td>
                      <td className="py-2 pr-4">{c.description}</td>
                      <td className="py-2 text-right font-bold tabular-nums">{c.quantity}</td>
                    </tr>
                  ))}
                  {!components.length && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-muted-foreground">
                        Nenhum produto selecionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-lg border bg-surface p-5 shadow-sm">
            <h3 className="text-base font-bold">Observações</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {notes.map((n, i) => (
                <li key={i} className="rounded-md border border-warn bg-warn px-3 py-2 text-warn-foreground">
                  {n}
                </li>
              ))}
            </ul>
          </article>
        </section>
      </div>

      {selected && (
        <PrintArea>
          <PrintHeader title="Lista de peças necessárias" />
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ fontSize: 18, margin: "0 0 6px" }}>{selected.Descricao}</h2>
            <p style={{ margin: 0, fontSize: 13 }}>
              Código: <strong>{selected.Codigo}</strong> · Categoria: <strong>{selected.Categoria}</strong> ·
              Tamanho: <strong>{selected.Tamanho} cm</strong> · Tensão: <strong>{selected.Tensao}</strong>
              {selected.Cor ? <> · Cor: <strong>{selected.Cor}</strong></> : null}
            </p>
            <p style={{ fontSize: 18, margin: "10px 0 0" }}>
              Quantidade do produto: <strong>{quantity}</strong>
            </p>
          </div>
          <table className="print-table">
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Código</th>
                <th>Descrição</th>
                <th style={{ textAlign: "right" }}>Qtd</th>
              </tr>
            </thead>
            <tbody>
              {components.map((c, i) => (
                <tr key={i}>
                  <td>{c.group}</td>
                  <td>{c.code}</td>
                  <td>{c.description}</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{c.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 18 }}>
            <h3 style={{ fontSize: 14, marginBottom: 6 }}>Observações</h3>
            <ul>{notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
          </div>
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
  label,
  value,
  onChange,
  options,
  allLabel,
  format,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  allLabel: string;
  format?: (v: string) => string;
}) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input">
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {format ? format(o) : o}
          </option>
        ))}
      </select>
    </Field>
  );
}
