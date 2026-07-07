import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Trash2, CheckCircle2, PlayCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { DbProductionOrder } from "@/lib/db";

export const Route = createFileRoute("/producao")({
  head: () => ({ meta: [{ title: "Produção • DOMINA CRM" }] }),
  component: Producao,
});

const statusTone: Record<string, string> = {
  rascunho: "bg-muted text-muted-foreground",
  em_producao: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  concluido: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};
const statusLabel: Record<string, string> = {
  rascunho: "Rascunho", em_producao: "Em produção", concluido: "Concluído",
};

function Producao() {
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["production_orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("production_orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DbProductionOrder[];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (status === "concluido") {
        const { error } = await supabase.rpc("complete_production_order", { _order_id: id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("production_orders").update({ status }).eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => {
      toast.success(v.status === "concluido" ? "Ordem concluída — estoque baixado" : "Status atualizado");
      qc.invalidateQueries({ queryKey: ["production_orders"] });
      qc.invalidateQueries({ queryKey: ["stock"] });
      qc.invalidateQueries({ queryKey: ["movements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("production_orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Ordem removida"); qc.invalidateQueries({ queryKey: ["production_orders"] }); },
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Produção</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Ordens de produção</h1>
        <p className="mt-1 text-sm text-muted-foreground">Crie ordens a partir da tela de Carga.</p>
      </header>

      <div className="rounded-lg border bg-surface shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-surface text-xs uppercase text-muted-foreground">
            <tr className="border-b">
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-right">Unidades</th>
              <th className="p-3 text-right">Peças</th>
              <th className="p-3 text-left">Criada</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>}
            {orders.map((o) => (
              <tr key={o.id} className="border-b last:border-0 hover:bg-muted/40">
                <td className="p-2">
                  <Link to="/producao/$id" params={{ id: o.id }} className="inline-flex items-center gap-1 font-medium hover:text-primary">
                    <FileText className="h-3.5 w-3.5" /> {o.name || "Sem nome"}
                  </Link>
                </td>
                <td className="p-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone[o.status] ?? "bg-muted"}`}>
                    {statusLabel[o.status] ?? o.status}
                  </span>
                </td>
                <td className="p-2 text-right tabular-nums">{o.total_units}</td>
                <td className="p-2 text-right tabular-nums">{o.total_pieces}</td>
                <td className="p-2 text-muted-foreground text-xs">{new Date(o.created_at).toLocaleString("pt-BR")}</td>
                <td className="p-2">
                  <div className="flex justify-end gap-1">
                    {o.status === "rascunho" && (
                      <button onClick={() => setStatus.mutate({ id: o.id, status: "em_producao" })} className="rounded p-1.5 text-amber-600 hover:bg-amber-500/10" aria-label="Iniciar">
                        <PlayCircle className="h-4 w-4" />
                      </button>
                    )}
                    {o.status !== "concluido" && (
                      <button onClick={() => setStatus.mutate({ id: o.id, status: "concluido" })} className="rounded p-1.5 text-emerald-600 hover:bg-emerald-500/10" aria-label="Concluir">
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => { if (confirm("Excluir ordem?")) del.mutate(o.id); }} className="rounded p-1.5 text-destructive hover:bg-destructive/10" aria-label="Excluir">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && !orders.length && (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhuma ordem. Crie uma em <Link to="/carga" className="text-primary font-semibold">Carga</Link>.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
