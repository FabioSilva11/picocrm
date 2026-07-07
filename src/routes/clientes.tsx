import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { customerSchema, type DbCustomer } from "@/lib/db";

export const Route = createFileRoute("/clientes")({
  head: () => ({ meta: [{ title: "Clientes • DOMINA CRM" }] }),
  component: Clientes,
});

function Clientes() {
  const qc = useQueryClient();
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as DbCustomer[];
    },
  });

  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", notes: "" });

  const create = useMutation({
    mutationFn: async () => {
      const parsed = customerSchema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const { error } = await supabase.from("customers").insert(parsed.data);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente cadastrado");
      qc.invalidateQueries({ queryKey: ["customers"] });
      setForm({ name: "", email: "", phone: "", company: "", notes: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Cliente removido"); qc.invalidateQueries({ queryKey: ["customers"] }); },
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Clientes</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Cadastro de clientes</h1>
      </header>

      <div className="rounded-lg border bg-surface p-5 shadow-sm">
        <h3 className="font-bold mb-3">Novo cliente</h3>
        <div className="grid gap-3 md:grid-cols-5">
          <input placeholder="Nome*" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Telefone" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Empresa" className="input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <button onClick={() => create.mutate()} disabled={create.isPending} className="inline-flex items-center justify-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Adicionar
          </button>
        </div>
      </div>

      <div className="rounded-lg border bg-surface shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-surface text-xs uppercase text-muted-foreground">
            <tr className="border-b">
              <th className="p-3 text-left">Nome</th><th className="p-3 text-left">Empresa</th><th className="p-3 text-left">Contato</th><th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>}
            {customers.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/40">
                <td className="p-2 font-medium">{c.name}</td>
                <td className="p-2 text-muted-foreground">{c.company || "-"}</td>
                <td className="p-2 text-muted-foreground text-xs">{[c.email, c.phone].filter(Boolean).join(" · ") || "-"}</td>
                <td className="p-2 text-right">
                  <button onClick={() => { if (confirm(`Excluir ${c.name}?`)) del.mutate(c.id); }} className="rounded p-1.5 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && !customers.length && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhum cliente cadastrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
