import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { DbSalesOrder, DbCustomer } from "@/lib/db";

export const Route = createFileRoute("/vendas")({
  head: () => ({ meta: [{ title: "Vendas • DOMINA CRM" }] }),
  component: Vendas,
});

const statusOpts = ["rascunho", "pago", "enviado", "cancelado"];

function money(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Vendas() {
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["sales_orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales_orders").select("*, customers(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as (DbSalesOrder & { customers?: { name: string } | null })[];
    },
  });
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data } = await supabase.from("customers").select("id,name").order("name");
      return (data ?? []) as Pick<DbCustomer, "id" | "name">[];
    },
  });

  const [customerId, setCustomerId] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sales_orders").insert({
        customer_id: customerId || null, status: "rascunho", notes: "", total_cents: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Pedido criado"); qc.invalidateQueries({ queryKey: ["sales_orders"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("sales_orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales_orders"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sales_orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Pedido removido"); qc.invalidateQueries({ queryKey: ["sales_orders"] }); },
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Vendas</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Pedidos</h1>
      </header>

      <div className="rounded-lg border bg-surface p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <select className="input w-64" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">Sem cliente</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={() => create.mutate()} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> Novo pedido
        </button>
      </div>

      <div className="rounded-lg border bg-surface shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-surface text-xs uppercase text-muted-foreground">
            <tr className="border-b">
              <th className="p-3 text-left">Cliente</th><th className="p-3 text-left">Status</th>
              <th className="p-3 text-right">Total</th><th className="p-3 text-left">Criado</th><th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>}
            {orders.map((o) => (
              <tr key={o.id} className="border-b last:border-0 hover:bg-muted/40">
                <td className="p-2 font-medium">{o.customers?.name || <span className="text-muted-foreground">—</span>}</td>
                <td className="p-2">
                  <select value={o.status} onChange={(e) => setStatus.mutate({ id: o.id, status: e.target.value })} className="input h-8 w-32 text-xs">
                    {statusOpts.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td className="p-2 text-right tabular-nums">{money(o.total_cents)}</td>
                <td className="p-2 text-muted-foreground text-xs">{new Date(o.created_at).toLocaleString("pt-BR")}</td>
                <td className="p-2 text-right">
                  <button onClick={() => { if (confirm("Excluir pedido?")) del.mutate(o.id); }} className="rounded p-1.5 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && !orders.length && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum pedido.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">Itens do pedido e valor serão adicionados na próxima iteração.</p>
    </div>
  );
}
