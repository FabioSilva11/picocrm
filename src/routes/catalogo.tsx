import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Save, Trash2, X, Loader2, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { catalogItemSchema, normalize } from "@/lib/db";
import { useRealtime } from "@/hooks/useRealtime";
import { toCSV, downloadCSV, parseCSV } from "@/lib/csv";
import { sourceTone, typeTone, tensionTone, defaultTone } from "@/lib/badges";

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

type Draft = Omit<CatalogRow, "id">;

const FONTES = ["Ventilador", "Motor", "Estoque"];

const emptyDraft = (): Draft => ({
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
    .order("codigo");
  if (error) throw error;
  return data as CatalogRow[];
}

function validate(row: Draft): string | null {
  const parsed = catalogItemSchema.safeParse(row);
  if (parsed.success) return null;
  return parsed.error.issues[0]?.message ?? "Dados inválidos";
}

function Catalogo() {
  const qc = useQueryClient();
  useRealtime("catalog_items", [["catalog_items"]]);
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ["catalog_items"],
    queryFn: fetchItems,
  });

  const [search, setSearch] = useState("");
  const [source, setSource] = useState("");
  const [filterTension, setFilterTension] = useState("");
  const [filterSize, setFilterSize] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [creating, setCreating] = useState(false);
  const [newRow, setNewRow] = useState<Draft>(emptyDraft());

  const invalidate = () => qc.invalidateQueries({ queryKey: ["catalog_items"] });

  // Opções únicas para chips
  const uniqueTensions = useMemo(() =>
    [...new Set(items.map((i) => i.tensao).filter(Boolean))].sort(), [items]);
  const uniqueSizes = useMemo(() =>
    [...new Set(items.map((i) => i.tamanho).filter((x): x is number => x != null))].sort((a, b) => a - b), [items]);

  const createMut = useMutation({
    mutationFn: async (row: Draft) => {
      const err = validate(row);
      if (err) throw new Error(err);
      const { error } = await supabase.from("catalog_items").insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item adicionado");
      invalidate();
      setCreating(false);
      setNewRow(emptyDraft());
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, row }: { id: string; row: Draft }) => {
      const err = validate(row);
      if (err) throw new Error(err);
      const { error } = await supabase.from("catalog_items").update(row).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item atualizado");
      invalidate();
      setEditingId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("catalog_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item removido");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const q = normalize(search);
    return items.filter((it) => {
      if (source && it.fonte !== source) return false;
      if (filterTension && it.tensao !== filterTension) return false;
      if (filterSize && it.tamanho !== Number(filterSize)) return false;
      if (!q) return true;
      return (
        normalize(it.codigo).includes(q) ||
        normalize(it.descricao).includes(q) ||
        normalize(it.categoria).includes(q) ||
        normalize(it.cor).includes(q) ||
        normalize(it.tensao).includes(q)
      );
    });
  }, [items, search, source, filterTension, filterSize]);

  const startEdit = (row: CatalogRow) => {
    setEditingId(row.id);
    const { id: _id, ...rest } = row;
    setDraft(rest);
  };

  const remove = (row: CatalogRow) => {
    toast(`Excluir ${row.codigo}?`, {
      description: row.descricao,
      action: { label: "Excluir", onClick: () => deleteMut.mutate(row.id) },
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Catálogo</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Todos os itens</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} itens salvos no Lovable Cloud.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const csv = toCSV(
                items.map((i) => ({
                  fonte: i.fonte, codigo: i.codigo, descricao: i.descricao,
                  categoria: i.categoria, tamanho: i.tamanho ?? "", tensao: i.tensao,
                  cor: i.cor ?? "", calculavel: i.calculavel,
                })),
                ["fonte", "codigo", "descricao", "categoria", "tamanho", "tensao", "cor", "calculavel"],
              );
              downloadCSV(`catalogo-${new Date().toISOString().slice(0, 10)}.csv`, csv);
            }}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-semibold hover:bg-muted"
          >
            <Download className="h-4 w-4" /> Exportar
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-semibold hover:bg-muted"
          >
            <Upload className="h-4 w-4" /> Importar
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              try {
                const rows = parseCSV(await f.text());
                let ok = 0;
                for (const r of rows) {
                  const payload = {
                    fonte: (r.fonte || "Estoque") as "Ventilador" | "Motor" | "Estoque",
                    codigo: (r.codigo || "").trim(),
                    descricao: (r.descricao || "").trim(),
                    categoria: r.categoria || "",
                    tamanho: r.tamanho ? Number(r.tamanho) : null,
                    tensao: r.tensao || "",
                    cor: r.cor || null,
                    calculavel: (r.calculavel === "Sim" ? "Sim" : "Nao") as "Sim" | "Nao",
                  };
                  if (!payload.codigo || !payload.descricao) continue;
                  const parsed = catalogItemSchema.safeParse(payload);
                  if (!parsed.success) continue;
                  const existing = items.find((it) => it.codigo === payload.codigo);
                  if (existing) {
                    await supabase.from("catalog_items").update(payload).eq("id", existing.id);
                  } else {
                    await supabase.from("catalog_items").insert(payload);
                  }
                  ok++;
                }
                toast.success(`${ok} itens importados`);
                invalidate();
              } catch (err) {
                toast.error((err as Error).message);
              }
            }}
          />
          <button
            onClick={() => {
              setCreating(true);
              setNewRow(emptyDraft());
            }}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Novo item
          </button>
        </div>
      </header>

      {/* Barra de filtros */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar código, descrição, cor..."
            className="input max-w-md flex-1"
          />
          <select value={source} onChange={(e) => setSource(e.target.value)} className="input w-44">
            <option value="">Todas as origens</option>
            {FONTES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span className="ml-auto rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            {filtered.length} resultados
          </span>
        </div>

        {/* Chips tensão */}
        {uniqueTensions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Tensão:</span>
            {uniqueTensions.map((t) => {
              const active = filterTension === t;
              return (
                <button
                  key={t}
                  onClick={() => setFilterTension(active ? "" : t)}
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors
                    ${active
                      ? (t === "127V" ? "bg-blue-600 text-white border-blue-600"
                        : t === "220V" ? "bg-orange-600 text-white border-orange-600"
                        : "bg-teal-600 text-white border-teal-600")
                      : (tensionTone[t] ?? defaultTone)
                    }`}
                >
                  {t}
                  {active && <X className="ml-1 h-2.5 w-2.5" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Chips tamanho */}
        {uniqueSizes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Tamanho:</span>
            {uniqueSizes.map((s) => {
              const active = filterSize === String(s);
              return (
                <button
                  key={s}
                  onClick={() => setFilterSize(active ? "" : String(s))}
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors
                    ${active ? "bg-foreground text-background border-foreground" : "bg-muted text-muted-foreground border-border"}`}
                >
                  {s} cm
                  {active && <X className="ml-1 h-2.5 w-2.5" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Erro: {(error as Error).message}
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
                    onSave={() => updateMut.mutate({ id: editingId!, row: draft })}
                    onCancel={() => setEditingId(null)}
                    saving={updateMut.isPending}
                  />
                ) : (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${sourceTone[item.fonte] ?? defaultTone}`}>
                        {item.fonte}
                      </span>
                    </td>
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{item.codigo}</td>
                    <td className="px-3 py-2 font-medium">{item.descricao}</td>
                    <td className="px-3 py-2">
                      {item.categoria ? (
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${typeTone[item.categoria] ?? defaultTone}`}>
                          {item.categoria}
                        </span>
                      ) : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-3 py-2">
                      {item.tamanho != null ? (
                        <span className="inline-flex rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
                          {item.tamanho} cm
                        </span>
                      ) : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-3 py-2">
                      {item.tensao ? (
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${tensionTone[item.tensao] ?? defaultTone}`}>
                          {item.tensao}
                        </span>
                      ) : <span className="text-muted-foreground">-</span>}
                    </td>
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
  row: Draft;
  onChange: (row: Draft) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

function EditRow({ row, onChange, onSave, onCancel, saving }: EditRowProps) {
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => onChange({ ...row, [k]: v });
  return (
    <tr className="border-b bg-primary/5">
      <td className="px-2 py-2">
        <select value={row.fonte} onChange={(e) => set("fonte", e.target.value)} className="input h-8 w-28 text-xs">
          {FONTES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-2">
        <input value={row.codigo} onChange={(e) => set("codigo", e.target.value)} placeholder="Código" className="input h-8 w-32 text-xs" />
      </td>
      <td className="px-2 py-2">
        <input value={row.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Descrição" className="input h-8 w-full text-xs" />
      </td>
      <td className="px-2 py-2">
        <input value={row.categoria} onChange={(e) => set("categoria", e.target.value)} className="input h-8 w-28 text-xs" />
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
        <input value={row.tensao} onChange={(e) => set("tensao", e.target.value)} className="input h-8 w-24 text-xs" />
      </td>
      <td className="px-2 py-2">
        <input value={row.cor ?? ""} onChange={(e) => set("cor", e.target.value)} className="input h-8 w-24 text-xs" />
      </td>
      <td className="px-2 py-2">
        <select value={row.calculavel} onChange={(e) => set("calculavel", e.target.value)} className="input h-8 w-20 text-xs">
          <option>Sim</option>
          <option>Nao</option>
        </select>
      </td>
      <td className="px-2 py-2">
        <div className="flex justify-end gap-1">
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Salvar
          </button>
          <button onClick={onCancel} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" aria-label="Cancelar">
            <X className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
