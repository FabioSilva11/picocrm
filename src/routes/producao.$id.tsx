import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { DbProductionOrder, DbProductionOrderItem } from "@/lib/db";

export const Route = createFileRoute("/producao/$id")({
  head: () => ({ meta: [{ title: "Ordem de produção • DOMINA CRM" }] }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["production_order", id],
    queryFn: async () => {
      const [{ data: order }, { data: items }] = await Promise.all([
        supabase.from("production_orders").select("*").eq("id", id).single(),
        supabase.from("production_order_items").select("*").eq("order_id", id),
      ]);
      return { order: order as DbProductionOrder | null, items: (items ?? []) as DbProductionOrderItem[] };
    },
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data?.order) return <div>Ordem não encontrada.</div>;

  return (
    <div className="space-y-6">
      <Link to="/producao" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Ordem #{data.order.id.slice(0, 8)}</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">{data.order.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Status: <strong>{data.order.status}</strong> · {data.order.total_units} unidades · {data.order.total_pieces} peças
        </p>
      </header>
      <div className="rounded-lg border bg-surface shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-surface text-xs uppercase text-muted-foreground">
            <tr className="border-b"><th className="p-3 text-left">Código</th><th className="p-3 text-left">Produto</th><th className="p-3 text-right">Qtd</th></tr>
          </thead>
          <tbody>
            {data.items.map((i) => (
              <tr key={i.id} className="border-b last:border-0">
                <td className="p-2 text-muted-foreground">{i.product_code}</td>
                <td className="p-2">{i.product_description}</td>
                <td className="p-2 text-right font-bold tabular-nums">{i.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
