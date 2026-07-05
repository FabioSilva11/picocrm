import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { catalog, calculateLoad, normalize } from "@/lib/catalog";
import { PrintArea, PrintHeader, usePrint } from "@/lib/print";
import { Printer, Eraser } from "lucide-react";

export const Route = createFileRoute("/carga")({
  head: () => ({
    meta: [
      { title: "Carga • DOMINA CRM" },
      { name: "description", content: "Consolide peças da carga completa e imprima a lista." },
    ],
  }),
  component: Carga,
});

function Carga() {
  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const q: Record<string, number> = {};
    for (const item of catalog.load.products) q[item.Codigo] = Number(item.Quantidade) || 0;
    return q;
  });
  const print = usePrint();

  const filtered = useMemo(() => {
    const q = normalize(search);
    if (!q) return catalog.load.products;
    return catalog.load.products.filter(
      (i) =>
        normalize(i.Codigo).includes(q) ||
        normalize(i.Descricao).includes(q) ||
        normalize(i.Categoria).includes(q) ||
        normalize(i.Cor).includes(q) ||
        normalize(i.Tensao).includes(q),
    );
  }, [search]);

  const result = useMemo(() => calculateLoad(quantities), [quantities]);

  function setQty(code: string, value: number) {
    setQuantities((q) => ({ ...q, [code]: Math.max(0, value | 0) }));
  }

  function clearAll() {
    const zeroed: Record<string, number> = {};
    for (const k of Object.keys(quantities)) zeroed[k] = 0;
    setQuantities(zeroed);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Carga</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Consolidação de peças</h1>
          <p className="mt-1 text-sm text-muted-foreground">Arquivo: {catalog.load.sourceFile}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Produtos" value={result.products.length} />
          <Stat label="Unidades" value={result.totalUnits} />
          <Stat label="Peças" value={result.totalPieces} />
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar produto da carga"
          className="input max-w-md flex-1"
        />
        <button
          onClick={clearAll}
          className="flex items-center gap-2 rounded-md border bg-surface px-4 py-2 text-sm font-bold hover:bg-muted"
        >
          <Eraser className="h-4 w-4" /> Zerar
        </button>
        <button
          onClick={print}
          disabled={!result.totalUnits}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <Printer className="h-4 w-4" /> Imprimir carga
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <article className="rounded-lg border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold">Produtos da carga</h3>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              {filtered.length} itens
            </span>
          </div>
          <div className="mt-3 max-h-[560px] overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-surface text-xs uppercase tracking-wide text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 pr-4">Código</th>
                  <th className="py-2 pr-4">Descrição</th>
                  <th className="py-2 pr-4">Detalhes</th>
                  <th className="py-2 text-right">Qtd</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const details = [
                    item.Categoria,
                    item.Tamanho ? `${item.Tamanho} cm` : "",
                    item.Tensao,
                    item.Cor,
                  ]
                    .filter(Boolean)
                    .join(" · ");
                  const missing = item.ProdutoEncontrado === "Nao";
                  return (
                    <tr key={item.Codigo} className={`border-b last:border-0 ${missing ? "bg-warn/40" : ""}`}>
                      <td className="py-2 pr-4 text-muted-foreground">{item.Codigo}</td>
                      <td className="py-2 pr-4">{item.Descricao}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{details || "-"}</td>
                      <td className="py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          value={quantities[item.Codigo] ?? 0}
                          onChange={(e) => setQty(item.Codigo, Number(e.target.value))}
                          className="w-20 rounded-md border bg-background px-2 py-1 text-right tabular-nums outline-none focus:border-primary"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-lg border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold">Peças consolidadas</h3>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              {result.pieces.length} itens
            </span>
          </div>
          <div className="mt-3 max-h-[560px] overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-surface text-xs uppercase tracking-wide text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 pr-4">Grupo</th>
                  <th className="py-2 pr-4">Código</th>
                  <th className="py-2 pr-4">Descrição</th>
                  <th className="py-2 text-right">Qtd</th>
                </tr>
              </thead>
              <tbody>
                {result.pieces.map((p, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-semibold text-primary">{p.group}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{p.code}</td>
                    <td className="py-2 pr-4">{p.description}</td>
                    <td className="py-2 text-right font-bold tabular-nums">{p.quantity}</td>
                  </tr>
                ))}
                {!result.pieces.length && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      Informe quantidades na carga para calcular.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      {result.totalUnits > 0 && (
        <PrintArea>
          <PrintHeader title="Cálculo de carga" subtitle={`Arquivo: ${catalog.load.sourceFile}`} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
            <div><strong>Produtos:</strong> {result.products.length}</div>
            <div><strong>Unidades:</strong> {result.totalUnits}</div>
            <div><strong>Peças:</strong> {result.totalPieces}</div>
          </div>
          <h2 style={{ fontSize: 18, margin: "0 0 8px" }}>Produtos da carga</h2>
          <table className="print-table" style={{ marginBottom: 18 }}>
            <thead>
              <tr><th>Código</th><th>Produto</th><th>Categoria</th><th style={{ textAlign: "right" }}>Qtd</th></tr>
            </thead>
            <tbody>
              {result.products.map((p) => (
                <tr key={p.Codigo}>
                  <td>{p.Codigo}</td>
                  <td>{p.Descricao}</td>
                  <td>{p.Categoria ?? "-"}</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{p.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h2 style={{ fontSize: 18, margin: "0 0 8px" }}>Peças consolidadas</h2>
          <table className="print-table">
            <thead>
              <tr><th>Grupo</th><th>Código</th><th>Descrição</th><th style={{ textAlign: "right" }}>Qtd</th></tr>
            </thead>
            <tbody>
              {result.pieces.map((p, i) => (
                <tr key={i}>
                  <td>{p.group}</td>
                  <td>{p.code}</td>
                  <td>{p.description}</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{p.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </PrintArea>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-surface px-3 py-2 text-right">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xl font-black tabular-nums">{value}</p>
    </div>
  );
}
