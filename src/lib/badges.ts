/**
 * Paletas de badge compartilhadas entre Calculadora e Catálogo.
 */

// ── Tipo / Categoria ────────────────────────────────────────────────────────
export const typeTone: Record<string, string> = {
  Mesa:     "bg-violet-500/10 text-violet-700 border-violet-300 dark:text-violet-400 dark:border-violet-700",
  Parede:   "bg-sky-500/10 text-sky-700 border-sky-300 dark:text-sky-400 dark:border-sky-700",
  Coluna:   "bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700",
  Practice: "bg-amber-500/10 text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-700",
};

export const typeActiveTone: Record<string, string> = {
  Mesa:     "bg-violet-600 text-white border-violet-600",
  Parede:   "bg-sky-600 text-white border-sky-600",
  Coluna:   "bg-emerald-600 text-white border-emerald-600",
  Practice: "bg-amber-600 text-white border-amber-600",
};

// ── Tensão ──────────────────────────────────────────────────────────────────
export const tensionTone: Record<string, string> = {
  "127V":   "bg-blue-500/10 text-blue-700 border-blue-300 dark:text-blue-400 dark:border-blue-700",
  "220V":   "bg-orange-500/10 text-orange-700 border-orange-300 dark:text-orange-400 dark:border-orange-700",
  Bivolt:   "bg-teal-500/10 text-teal-700 border-teal-300 dark:text-teal-400 dark:border-teal-700",
};

export const tensionActiveTone: Record<string, string> = {
  "127V":   "bg-blue-600 text-white border-blue-600",
  "220V":   "bg-orange-600 text-white border-orange-600",
  Bivolt:   "bg-teal-600 text-white border-teal-600",
};

// ── Origem (fonte) ──────────────────────────────────────────────────────────
export const sourceTone: Record<string, string> = {
  Ventilador: "bg-primary/10 text-primary border-primary/30",
  Motor:      "bg-amber-500/10 text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-700",
  Estoque:    "bg-sky-500/10 text-sky-700 border-sky-300 dark:text-sky-400 dark:border-sky-700",
};

// ── Tamanho ─────────────────────────────────────────────────────────────────
export const sizeTone = "bg-muted text-muted-foreground border-border";

// ── Fallback ─────────────────────────────────────────────────────────────────
export const defaultTone     = "bg-muted text-muted-foreground border-border";
export const defaultActiveTone = "bg-foreground text-background border-foreground";

// ── Helper ───────────────────────────────────────────────────────────────────
export function badge(classes: string, label: string) {
  return { classes, label };
}
