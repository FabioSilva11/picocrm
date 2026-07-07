import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Save, Trash2, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { catalog, normalize } from "@/lib/catalog";

export const Route = createFileRoute("/catalogo")({
  head: () => ({
    meta: [
      { title: "Catálogo • DOMINA CRM" },
      {
        name: "description",
        content: "Gerencie o catálogo DOMINA: adicione, edite e remova itens salvos no Lovable Cloud.",
      },
    ],
  }),
  component: Catalogo,
});

interface CatalogRow {
  id: string;
  fonte: string;
  codigo: string;
  descricao: string;
  categoria: string;
  tamanho: number | null;
  tensao: string;
  cor: string | null;
  calculavel: string;
}

const sourceTone: Record<string, string> = {
  Ventilador: "bg-primary/10 text-primary",
  Motor: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  Estoque: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
};

const FONTES = ["Ventilador", "Motor", "Estoque"];

const emptyDraft = (): Omit<CatalogRow, "id"> => ({
  fonte: "Estoque",
  codigo: "",
  descricao: "",
  categoria: "",
  tamanho: null,
  tensao: "",
  cor: "",
  calculavel: "Nao",
});

async function fetchItems(): Promise<CatalogRow[]> {
  const { data, error } = await supabase
    .from("catalog_items")
    .select("id,fonte,codigo,descricao,categoria,tamanho,tensao,cor,calculavel")
    .order("codigo", { ascending: true });
  if (error) throw error;
  return data as CatalogRow[];
}

function Catalogo() {
  const qc = useQueryClient();
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ["catalog_items"],
    queryFn: fetchItems,
  });

  const [search, setSearch] = useState("");
  const [source, setSource] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<CatalogRow, "id">>(emptyDraft());
  const [creating, setCreating] = useState(false);
  const [newRow, setNewRow] = useState<Omit<CatalogRow, "id">>(emptyDraft());

  const invalidate = () => qc.invalidateQueries({ queryKey: ["catalog_items"] });

  const createMut = useMutation({
    mutationFn: async (row: Omit<CatalogRow, "id">) => {
      const { error } = await supabase.from("catalog_items").insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setCreating(false);
      setNewRow(emptyDraft());
    },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, row }: { id: string; row: Omit<CatalogRow, "id"> }) => {
      const { error } = await supabase.from("catalog_items").update(row).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("catalog_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const filtered = useMemo(() => {
    const q = normalize(search);
    return items.filter((it) => {
      if (source && it.fonte !== source) return false;
      if (!q) return true;
      return (
        normalize(it.codigo).includes(q) ||
        normalize(it.descricao).includes(q) ||
        normalize(it.categoria).includes(q) ||
        normalize(it.cor).includes(q) ||
        normalize(it.tensao).includes(q)
      );
    });
  }, [items, search, source]);

  const startEdit = (row: CatalogRow) => {
    setEditingId(row.id);
    const { id: _id, ...rest } = row;
    setDraft(rest);
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateMut.mutate({ id: editingId, row: draft });
  };

  const remove = (row: CatalogRow) => {
    if (!confirm(`Excluir "${row.codigo} — ${row.descricao}"?`)) return;
    deleteMut.mutate(row.id);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Catálogo</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Todos os itens</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} itens salvos no Lovable Cloud · {catalog.filters.sources.length} origens.
          </p>
        </div>
        <button
          onClick={() => {
            setCreating(true);
            setNewRow(emptyDraft());
          }}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Novo item
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar código, descrição, cor..."
          className="input max-w-md flex-1"
        />
        <select value={source} onChange={(e) => setSource(e.target.value)} className="input w-56">
          <option value="">Todas as origens</option>
          {FONTES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="ml-auto rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
          {filtered.length} resultados
        </span>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Erro ao carregar itens: {(error as Error).message}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border bg-surface shadow-sm">
        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-surface text-xs uppercase tracking-wide text-muted-foreground">
              <tr className="border-b">
                <th className="px-3 py-3">Origem</th>
                <th className="px-3 py-3">Código</th>
                <th className="px-3 py-3">Descrição</th>
                <th className="px-3 py-3">Categoria</th>
                <th className="px-3 py-3">Tamanho</th>
                <th className="px-3 py-3">Tensão</th>
                <th className="px-3 py-3">Cor</th>
                <th className="px-3 py-3">Calc.</th>
                <th className="px-3 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {creating && (
                <EditRow
                  row={newRow}
                  onChange={setNewRow}
                  onSave={() => createMut.mutate(newRow)}
                  onCancel={() => setCreating(false)}
                  saving={createMut.isPending}
                  error={createMut.error as Error | null}
                />
              )}

              {isLoading && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              )}

              {filtered.map((item) =>
                editingId === item.id ? (
                  <EditRow
                    key={item.id}
                    row={draft}
                    onChange={setDraft}
                    onSave={saveEdit}
                    onCancel={() => setEditingId(null)}
                    saving={updateMut.isPending}
                    error={updateMut.error as Error | null}
                  />
                ) : (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          sourceTone[item.fonte] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.fonte}
                      </span>
                    </td>
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{item.codigo}</td>
                    <td className="px-3 py-2 font-medium">{item.descricao}</td>
                    <td className="px-3 py-2 text-muted-foreground">{item.categoria || "-"}</td>
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">
                      {item.tamanho ?? "-"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{item.tensao || "-"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{item.cor || "-"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{item.calculavel}</td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => startEdit(item)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => remove(item)}
                          disabled={deleteMut.isPending}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}

              {!isLoading && !filtered.length && !creating && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum item corresponde aos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface EditRowProps {
  row: Omit<CatalogRow, "id">;
  onChange: (row: Omit<CatalogRow, "id">) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: Error | null;
}

function EditRow({ row, onChange, onSave, onCancel, saving, error }: EditRowProps) {
  const set = <K extends keyof Omit<CatalogRow, "id">>(k: K, v: Omit<CatalogRow, "id">[K]) =>
    onChange({ ...row, [k]: v });

  return (
    <>
      <tr className="border-b bg-primary/5">
        <td className="px-2 py-2">
          <select
            value={row.fonte}
            onChange={(e) => set("fonte", e.target.value)}
            className="input h-8 w-28 text-xs"
          >
            {FONTES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </td>
        <td className="px-2 py-2">
          <input
            value={row.codigo}
            onChange={(e) => set("codigo", e.target.value)}
            placeholder="Código"
            className="input h-8 w-32 text-xs"
          />
        </td>
        <td className="px-2 py-2">
          <input
            value={row.descricao}
            onChange={(e) => set("descricao", e.target.value)}
            placeholder="Descrição"
            className="input h-8 w-full text-xs"
          />
        </td>
        <td className="px-2 py-2">
          <input
            value={row.categoria}
            onChange={(e) => set("categoria", e.target.value)}
            className="input h-8 w-28 text-xs"
          />
        </td>
        <td className="px-2 py-2">
          <input
            type="number"
            value={row.tamanho ?? ""}
            onChange={(e) => set("tamanho", e.target.value === "" ? null : Number(e.target.value))}
            className="input h-8 w-20 text-xs"
          />
        </td>
        <td className="px-2 py-2">
          <input
            value={row.tensao}
            onChange={(e) => set("tensao", e.target.value)}
            className="input h-8 w-24 text-xs"
          />
        </td>
        <td className="px-2 py-2">
          <input
            value={row.cor ?? ""}
            onChange={(e) => set("cor", e.target.value)}
            className="input h-8 w-24 text-xs"
          />
        </td>
        <td className="px-2 py-2">
          <select
            value={row.calculavel}
            onChange={(e) => set("calculavel", e.target.value)}
            className="input h-8 w-20 text-xs"
          >
            <option>Sim</option>
            <option>Nao</option>
          </select>
        </td>
        <td className="px-2 py-2">
          <div className="flex justify-end gap-1">
            <button
              onClick={onSave}
              disabled={saving || !row.codigo || !row.descricao}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Salvar
            </button>
            <button
              onClick={onCancel}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
              aria-label="Cancelar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
      {error && (
        <tr className="border-b bg-destructive/5">
          <td colSpan={9} className="px-4 py-2 text-xs text-destructive">
            {error.message}
          </td>
        </tr>
      )}
    </>
  );
}
