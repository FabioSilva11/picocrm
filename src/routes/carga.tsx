import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Printer, Eraser, Loader2, Factory, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchProducts, fetchStock, calculateLoad, normalize,
} from "@/lib/db";
import { PrintArea, PrintHeader, usePrint } from "@/lib/print";

export const Route = createFileRoute("/carga")({
  head: () => ({
    meta: [
      { title: "Carga • DOMINA CRM" },
      { name: "description", content: "Consolide peças da carga, veja faltas no estoque e salve como ordem de produção." },
    ],
  }),
  component: Carga,
});

function Carga() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [orderName, setOrderName] = useState("");
  const print = usePrint();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products_full"],
    queryFn: fetchProducts,
  });
  const { data: stock = [] } = useQuery({ queryKey: ["stock"], queryFn: fetchStock });

  const stockMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of stock) m.set(s.item_code, s.quantity);
    return m;
  }, [stock]);

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

  const saveOrder = useMutation({
    mutationFn: async () => {
      if (!result.totalUnits) throw new Error("Informe quantidades");
      const name = orderName.trim() || `Ordem ${new Date().toLocaleString("pt-BR")}`;
      const { data: order, error } = await supabase
        .from("production_orders")
        .insert({
          name,
          status: "rascunho",
          total_units: result.totalUnits,
          total_pieces: result.totalPieces,
        })
        .select()
        .single();
      if (error) throw error;
      const items = result.products.map((p) => ({
        order_id: order.id,
        product_code: p.codigo,
        product_description: p.descricao,
        quantity: p.quantity,
      }));
      const { error: e2 } = await supabase.from("production_order_items").insert(items);
      if (e2) throw e2;
      return order.id as string;
    },
    onSuccess: (id) => {
      toast.success("Ordem de produção criada");
      qc.invalidateQueries({ queryKey: ["production_orders"] });
      nav({ to: "/producao/$id", params: { id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

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
            Selecione quantidades, veja faltas no estoque e salve como ordem de produção.
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
        <input
          value={orderName}
          onChange={(e) => setOrderName(e.target.value)}
          placeholder="Nome da ordem (opcional)"
          className="input w-64"
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
        <button
          onClick={() => saveOrder.mutate()}
          disabled={!result.totalUnits || saveOrder.isPending}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saveOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Factory className="h-4 w-4" />}
          Salvar ordem
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
                    <th className="py-2 pr-2 text-right">Precisa</th>
                    <th className="py-2 pr-2 text-right">Estoque</th>
                    <th className="py-2 pr-2 text-right">Falta</th>
                  </tr>
                </thead>
                <tbody>
                  {result.pieces.map((p, i) => {
                    const have = stockMap.get(p.code) ?? 0;
                    const missing = Math.max(0, p.quantity - have);
                    return (
                      <tr key={i} className={`border-b last:border-0 ${missing > 0 ? "bg-destructive/5" : ""}`}>
                        <td className="py-2 pr-2 font-semibold text-primary">{p.group}</td>
                        <td className="py-2 pr-2 text-muted-foreground">{p.code}</td>
                        <td className="py-2 pr-2">{p.description}</td>
                        <td className="py-2 pr-2 text-right font-bold tabular-nums">{p.quantity}</td>
                        <td className="py-2 pr-2 text-right tabular-nums text-muted-foreground">{have}</td>
                        <td className={`py-2 pr-2 text-right tabular-nums font-bold ${missing > 0 ? "text-destructive" : "text-emerald-600"}`}>
                          {missing > 0 ? (
                            <span className="inline-flex items-center gap-1 justify-end">
                              <AlertTriangle className="h-3 w-3" /> {missing}
                            </span>
                          ) : "OK"}
                        </td>
                      </tr>
                    );
                  })}
                  {!result.pieces.length && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
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
