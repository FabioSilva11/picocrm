import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Minus, History } from "lucide-react";
import { fetchStock, fetchMovements, applyMovement, normalize } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/estoque")({
  head: () => ({ meta: [{ title: "Estoque • DOMINA CRM" }] }),
  component: Estoque,
});

function Estoque() {
  const qc = useQueryClient();
  const { data: stock = [], isLoading } = useQuery({ queryKey: ["stock"], queryFn: fetchStock });
  const { data: movs = [] } = useQuery({ queryKey: ["movements"], queryFn: () => fetchMovements(50) });
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ code: "", desc: "", delta: 1, reason: "Entrada manual" });

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
      setForm({ ...form, code: "", desc: "" });
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

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Estoque</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Peças em mãos</h1>
      </header>

      <div className="rounded-lg border bg-surface p-5 shadow-sm">
        <h3 className="font-bold mb-3">Registrar movimentação</h3>
        <div className="grid gap-3 md:grid-cols-[1fr_2fr_120px_1fr_auto_auto]">
          <input placeholder="Código" className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <input placeholder="Descrição" className="input" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
          <input type="number" placeholder="Qtd" className="input" value={Math.abs(form.delta)} onChange={(e) => setForm({ ...form, delta: Math.abs(Number(e.target.value)) * Math.sign(form.delta || 1) })} />
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
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
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
                  </tr>
                ))}
                {!isLoading && !filtered.length && (
                  <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhuma peça em estoque. Registre uma entrada acima.</td></tr>
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
