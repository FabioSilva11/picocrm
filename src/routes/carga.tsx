import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer, Eraser, Loader2 } from "lucide-react";
import {
  fetchProducts, calculateLoad, normalize,
} from "@/lib/db";
import { PrintArea, PrintHeader, usePrint } from "@/lib/print";

export const Route = createFileRoute("/carga")({
  head: () => ({
    meta: [
      { title: "Carga • DOMINA CRM" },
      { name: "description", content: "Consolide peças da carga e visualize os componentes necessários." },
    ],
  }),
  component: Carga,
});

function Carga() {
  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const print = usePrint();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products_full"],
    queryFn: fetchProducts,
  });

  const filtered = useMemo(() => {
    const q = normalize(search);
    if (!q) return products;
    return products.filter(
      (p) =>
        normalize(p.codigo).includes(q) ||
        normalize(p.descricao).includes(q) ||
        normalize(p.categoria).includes(q) ||
        normalize(p.cor).includes(q) ||
        normalize(p.tensao).includes(q),
    );
  }, [products, search]);

  const result = useMemo(() => calculateLoad(products, quantities), [products, quantities]);

  function setQty(code: string, value: number) {
    setQuantities((q) => ({ ...q, [code]: Math.max(0, value | 0) }));
  }
  function clearAll() {
    setQuantities({});
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Carga</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Consolidação de peças</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Selecione quantidades e veja os componentes necessários.
          </p>
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
          placeholder="Buscar produto"
          className="input max-w-md flex-1"
        />
        <button onClick={clearAll} className="flex items-center gap-2 rounded-md border bg-surface px-4 py-2 text-sm font-bold hover:bg-muted">
          <Eraser className="h-4 w-4" /> Zerar
        </button>
        <button
          onClick={print}
          disabled={!result.totalUnits}
          className="flex items-center gap-2 rounded-md border bg-surface px-4 py-2 text-sm font-bold hover:bg-muted disabled:opacity-50"
        >
          <Printer className="h-4 w-4" /> Imprimir
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <article className="rounded-lg border bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Produtos ({filtered.length})</h3>
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
                    const details = [item.categoria, item.tamanho ? `${item.tamanho} cm` : "", item.tensao, item.cor]
                      .filter(Boolean).join(" · ");
                    return (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 text-muted-foreground">{item.codigo}</td>
                        <td className="py-2 pr-4">{item.descricao}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{details || "-"}</td>
                        <td className="py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            value={quantities[item.codigo] ?? 0}
                            onChange={(e) => setQty(item.codigo, Number(e.target.value))}
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
              <h3 className="text-base font-bold">Peças consolidadas ({result.pieces.length})</h3>
            </div>
            <div className="mt-3 max-h-[560px] overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 bg-surface text-xs uppercase tracking-wide text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-2">Grupo</th>
                    <th className="py-2 pr-2">Código</th>
                    <th className="py-2 pr-2">Descrição</th>
                    <th className="py-2 pr-2 text-right">Quantidade</th>
                  </tr>
                </thead>
                <tbody>
                  {result.pieces.map((p, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 pr-2 font-semibold text-primary">{p.group}</td>
                      <td className="py-2 pr-2 text-muted-foreground">{p.code}</td>
                      <td className="py-2 pr-2">{p.description}</td>
                      <td className="py-2 pr-2 text-right font-bold tabular-nums">{p.quantity}</td>
                    </tr>
                  ))}
                  {!result.pieces.length && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        Informe quantidades para calcular.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      )}

      {result.totalUnits > 0 && (
        <PrintArea>
          <PrintHeader title="Cálculo de carga" />
          <table className="print-table" style={{ marginBottom: 18 }}>
            <thead><tr><th>Código</th><th>Produto</th><th style={{ textAlign: "right" }}>Qtd</th></tr></thead>
            <tbody>
              {result.products.map((p) => (
                <tr key={p.codigo}><td>{p.codigo}</td><td>{p.descricao}</td><td style={{ textAlign: "right" }}>{p.quantity}</td></tr>
              ))}
            </tbody>
          </table>
          <h2 style={{ fontSize: 18, margin: "0 0 8px" }}>Peças</h2>
          <table className="print-table">
            <thead><tr><th>Grupo</th><th>Código</th><th>Descrição</th><th style={{ textAlign: "right" }}>Qtd</th></tr></thead>
            <tbody>
              {result.pieces.map((p, i) => (
                <tr key={i}><td>{p.group}</td><td>{p.code}</td><td>{p.description}</td><td style={{ textAlign: "right" }}>{p.quantity}</td></tr>
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
