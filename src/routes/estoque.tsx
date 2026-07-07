import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Minus, History, Trash2, Download, Upload } from "lucide-react";
import { fetchStock, fetchMovements, applyMovement, normalize } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { useRealtime } from "@/hooks/useRealtime";
import { toCSV, downloadCSV, parseCSV } from "@/lib/csv";

export const Route = createFileRoute("/estoque")({
  head: () => ({ meta: [{ title: "Estoque • DOMINA CRM" }] }),
  component: Estoque,
});

function Estoque() {
  const qc = useQueryClient();
  useRealtime("stock", [["stock"]]);
  useRealtime("stock_movements", [["movements"]]);

  const { data: stock = [], isLoading } = useQuery({ queryKey: ["stock"], queryFn: fetchStock });
  const { data: movs = [] } = useQuery({ queryKey: ["movements"], queryFn: () => fetchMovements(50) });
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ code: "", desc: "", delta: 1, reason: "Entrada manual" });
  const fileRef = useRef<HTMLInputElement>(null);

  // Auto-fill description when typing a known code (stock, products, catalog)
  useEffect(() => {
    const code = form.code.trim();
    if (!code || form.desc) return;
    let cancelled = false;
    (async () => {
      // Try stock first
      const inStock = stock.find((s) => s.item_code === code);
      if (inStock) {
        if (!cancelled) setForm((f) => (f.code === code && !f.desc ? { ...f, desc: inStock.description } : f));
        return;
      }
      // Try catalog_items and product_components
      const [{ data: cat }, { data: comp }, { data: prod }] = await Promise.all([
        supabase.from("catalog_items").select("descricao").eq("codigo", code).maybeSingle(),
        supabase.from("product_components").select("description").eq("code", code).limit(1).maybeSingle(),
        supabase.from("products").select("descricao").eq("codigo", code).maybeSingle(),
      ]);
      const desc = cat?.descricao || comp?.description || prod?.descricao;
      if (desc && !cancelled) setForm((f) => (f.code === code && !f.desc ? { ...f, desc } : f));
    })();
    return () => {
      cancelled = true;
    };
  }, [form.code, stock, form.desc]);

  const filtered = useMemo(() => {
    const q = normalize(search);
    if (!q) return stock;
    return stock.filter((s) => normalize(s.item_code).includes(q) || normalize(s.description).includes(q));
  }, [stock, search]);

  const mv = useMutation({
    mutationFn: async ({ code, desc, delta, reason }: typeof form) => {
      if (!code.trim()) throw new Error("Código obrigatório");
      await applyMovement(code.trim(), desc.trim(), delta, reason);
    },
    onSuccess: () => {
      toast.success("Movimentação registrada");
      qc.invalidateQueries({ queryKey: ["stock"] });
      qc.invalidateQueries({ queryKey: ["movements"] });
      setForm((f) => ({ ...f, code: "", desc: "" }));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setMin = useMutation({
    mutationFn: async ({ code, min }: { code: string; min: number }) => {
      const { error } = await supabase.from("stock").update({ min_quantity: min }).eq("item_code", code);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stock"] }),
  });

  const del = useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase.from("stock").delete().eq("item_code", code);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item removido do estoque");
      qc.invalidateQueries({ queryKey: ["stock"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const exportCsv = () => {
    const csv = toCSV(
      stock.map((s) => ({
        item_code: s.item_code,
        description: s.description,
        quantity: s.quantity,
        min_quantity: s.min_quantity,
      })),
      ["item_code", "description", "quantity", "min_quantity"],
    );
    downloadCSV(`estoque-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const importCsv = async (file: File) => {
    const text = await file.text();
    const rows = parseCSV(text);
    if (!rows.length) return toast.error("CSV vazio");
    let ok = 0;
    for (const r of rows) {
      const code = (r.item_code || r.codigo || "").trim();
      if (!code) continue;
      const desc = (r.description || r.descricao || "").trim();
      const qty = Number(r.quantity || r.qtd || 0) | 0;
      const min = Number(r.min_quantity || r.minimo || 0) | 0;
      // upsert: apply movement to get to qty, then set min
      const cur = stock.find((s) => s.item_code === code);
      const delta = qty - (cur?.quantity ?? 0);
      if (delta !== 0 || !cur) {
        await applyMovement(code, desc, delta, "Import CSV");
      }
      await supabase.from("stock").update({ min_quantity: min, description: desc || undefined }).eq("item_code", code);
      ok++;
    }
    toast.success(`${ok} itens importados`);
    qc.invalidateQueries({ queryKey: ["stock"] });
    qc.invalidateQueries({ queryKey: ["movements"] });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Estoque</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Peças em mãos</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-semibold hover:bg-muted">
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
          <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-semibold hover:bg-muted">
            <Upload className="h-4 w-4" /> Importar CSV
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importCsv(f).catch((err: Error) => toast.error(err.message));
              e.target.value = "";
            }}
          />
        </div>
      </header>

      <div className="rounded-lg border bg-surface p-5 shadow-sm">
        <h3 className="font-bold mb-3">Registrar movimentação</h3>
        <div className="grid gap-3 md:grid-cols-[1fr_2fr_120px_1fr_auto_auto]">
          <input placeholder="Código" className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value, desc: "" })} />
          <input placeholder="Descrição (auto)" className="input" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
          <input type="number" placeholder="Qtd" className="input" value={Math.abs(form.delta)} onChange={(e) => setForm({ ...form, delta: Math.abs(Number(e.target.value)) || 1 })} />
          <input placeholder="Motivo" className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          <button onClick={() => mv.mutate({ ...form, delta: Math.abs(form.delta) })} className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:opacity-90">
            <Plus className="h-4 w-4" /> Entrada
          </button>
          <button onClick={() => mv.mutate({ ...form, delta: -Math.abs(form.delta) })} className="inline-flex items-center gap-1 rounded-md bg-destructive px-3 py-2 text-sm font-bold text-destructive-foreground hover:opacity-90">
            <Minus className="h-4 w-4" /> Saída
          </button>
        </div>
      </div>

      <input placeholder="Buscar" className="input max-w-md" value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-lg border bg-surface shadow-sm overflow-hidden">
          <div className="max-h-[60vh] overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-surface text-xs uppercase text-muted-foreground">
                <tr className="border-b">
                  <th className="p-3 text-left">Código</th>
                  <th className="p-3 text-left">Descrição</th>
                  <th className="p-3 text-right">Qtd</th>
                  <th className="p-3 text-right">Mínimo</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
                ) : filtered.map((s) => (
                  <tr key={s.item_code} className={`border-b ${s.quantity < s.min_quantity ? "bg-destructive/5" : ""}`}>
                    <td className="p-2 text-muted-foreground">{s.item_code}</td>
                    <td className="p-2">{s.description}</td>
                    <td className={`p-2 text-right font-bold tabular-nums ${s.quantity < s.min_quantity ? "text-destructive" : ""}`}>{s.quantity}</td>
                    <td className="p-2 text-right">
                      <input type="number" defaultValue={s.min_quantity} onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (v !== s.min_quantity) setMin.mutate({ code: s.item_code, min: v });
                      }} className="w-20 rounded border bg-background px-2 py-1 text-right tabular-nums" />
                    </td>
                    <td className="p-2 text-right">
                      <button
                        onClick={() => {
                          toast(`Excluir ${s.item_code} do estoque?`, {
                            description: s.description,
                            action: { label: "Excluir", onClick: () => del.mutate(s.item_code) },
                          });
                        }}
                        className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!isLoading && !filtered.length && (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhuma peça em estoque. Registre uma entrada acima.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border bg-surface shadow-sm">
          <div className="p-4 border-b flex items-center gap-2 font-bold"><History className="h-4 w-4" /> Últimas movimentações</div>
          <div className="max-h-[60vh] overflow-auto divide-y">
            {movs.map((m) => (
              <div key={m.id} className="p-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{m.item_code}</span>
                  <span className={`font-bold tabular-nums ${m.delta > 0 ? "text-emerald-600" : "text-destructive"}`}>
                    {m.delta > 0 ? "+" : ""}{m.delta}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">{m.description}</div>
                <div className="text-xs text-muted-foreground/70">{m.reason} · {new Date(m.created_at).toLocaleString("pt-BR")}</div>
              </div>
            ))}
            {!movs.length && <div className="p-8 text-center text-sm text-muted-foreground">Sem movimentações.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
