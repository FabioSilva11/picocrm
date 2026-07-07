import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtime } from "@/hooks/useRealtime";
import type { DbSalesOrder, DbSalesOrderItem } from "@/lib/db";

export const Route = createFileRoute("/vendas/$id")({
  head: () => ({ meta: [{ title: "Pedido de venda • DOMINA CRM" }] }),
  component: VendaDetail,
});

function money(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function VendaDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  useRealtime("sales_order_items", [["sales_order", id]]);
  useRealtime("sales_orders", [["sales_order", id]]);

  const { data, isLoading } = useQuery({
    queryKey: ["sales_order", id],
    queryFn: async () => {
      const [{ data: order }, { data: items }] = await Promise.all([
        supabase.from("sales_orders").select("*, customers(name)").eq("id", id).single(),
        supabase.from("sales_order_items").select("*").eq("order_id", id).order("created_at", { ascending: true }),
      ]);
      return {
        order: order as (DbSalesOrder & { customers?: { name: string } | null }) | null,
        items: (items ?? []) as DbSalesOrderItem[],
      };
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products_min"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("codigo,descricao").order("codigo");
      return (data ?? []) as { codigo: string; descricao: string }[];
    },
  });

  const [form, setForm] = useState({ code: "", desc: "", qty: 1, price: 0 });

  const addItem = useMutation({
    mutationFn: async () => {
      const code = form.code.trim();
      if (!code) throw new Error("Código obrigatório");
      const desc = form.desc.trim() || products.find((p) => p.codigo === code)?.descricao || code;
      const { error } = await supabase.from("sales_order_items").insert({
        order_id: id,
        product_code: code,
        product_description: desc,
        quantity: Math.max(1, form.qty | 0),
        unit_price_cents: Math.max(0, Math.round(form.price * 100)),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item adicionado");
      setForm({ code: "", desc: "", qty: 1, price: 0 });
      qc.invalidateQueries({ queryKey: ["sales_order", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateItem = useMutation({
    mutationFn: async ({ item, patch }: { item: DbSalesOrderItem; patch: Partial<DbSalesOrderItem> }) => {
      const { error } = await supabase.from("sales_order_items").update(patch).eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales_order", id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const delItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("sales_order_items").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales_order", id] }),
  });

  const total = useMemo(
    () => (data?.items ?? []).reduce((s, it) => s + it.quantity * it.unit_price_cents, 0),
    [data?.items],
  );

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data?.order) return <div>Pedido não encontrado.</div>;

  return (
    <div className="space-y-6">
      <Link to="/vendas" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <header className="flex flex-wrap justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Pedido #{data.order.id.slice(0, 8)}</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">{data.order.customers?.name || "Sem cliente"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Status: <strong>{data.order.status}</strong></p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase text-muted-foreground">Total</p>
          <p className="text-3xl font-black tabular-nums text-primary">{money(total)}</p>
        </div>
      </header>

      <div className="rounded-lg border bg-surface p-5 shadow-sm">
        <h3 className="font-bold mb-3">Adicionar item</h3>
        <div className="grid gap-3 md:grid-cols-[1fr_2fr_100px_140px_auto]">
          <input
            list="prod-list"
            placeholder="Código"
            className="input"
            value={form.code}
            onChange={(e) => {
              const code = e.target.value;
              const p = products.find((x) => x.codigo === code);
              setForm({ ...form, code, desc: p?.descricao ?? form.desc });
            }}
          />
          <datalist id="prod-list">
            {products.map((p) => <option key={p.codigo} value={p.codigo}>{p.descricao}</option>)}
          </datalist>
          <input placeholder="Descrição" className="input" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
          <input type="number" min={1} placeholder="Qtd" className="input" value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })} />
          <input type="number" step="0.01" min={0} placeholder="Preço R$" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          <button onClick={() => addItem.mutate()} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> Adicionar
          </button>
        </div>
      </div>

      <div className="rounded-lg border bg-surface shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-surface text-xs uppercase text-muted-foreground">
            <tr className="border-b">
              <th className="p-3 text-left">Código</th>
              <th className="p-3 text-left">Descrição</th>
              <th className="p-3 text-right w-24">Qtd</th>
              <th className="p-3 text-right w-32">Preço un.</th>
              <th className="p-3 text-right w-32">Subtotal</th>
              <th className="p-3 text-right w-16"></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((it) => (
              <tr key={it.id} className="border-b last:border-0">
                <td className="p-2 font-mono text-xs text-muted-foreground">{it.product_code}</td>
                <td className="p-2">{it.product_description}</td>
                <td className="p-2 text-right">
                  <input
                    type="number"
                    min={1}
                    defaultValue={it.quantity}
                    onBlur={(e) => {
                      const q = Math.max(1, Number(e.target.value) | 0);
                      if (q !== it.quantity) updateItem.mutate({ item: it, patch: { quantity: q } });
                    }}
                    className="w-20 rounded border bg-background px-2 py-1 text-right tabular-nums"
                  />
                </td>
                <td className="p-2 text-right">
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    defaultValue={(it.unit_price_cents / 100).toFixed(2)}
                    onBlur={(e) => {
                      const cents = Math.max(0, Math.round(Number(e.target.value) * 100));
                      if (cents !== it.unit_price_cents) updateItem.mutate({ item: it, patch: { unit_price_cents: cents } });
                    }}
                    className="w-28 rounded border bg-background px-2 py-1 text-right tabular-nums"
                  />
                </td>
                <td className="p-2 text-right font-bold tabular-nums">{money(it.quantity * it.unit_price_cents)}</td>
                <td className="p-2 text-right">
                  <button onClick={() => delItem.mutate(it.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!data.items.length && (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum item. Adicione acima.</td></tr>
            )}
          </tbody>
          {data.items.length > 0 && (
            <tfoot>
              <tr className="border-t bg-muted/40">
                <td colSpan={4} className="p-3 text-right font-bold uppercase text-xs">Total</td>
                <td className="p-3 text-right font-black tabular-nums text-primary">{money(total)}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
