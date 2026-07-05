import { useCallback } from "react";
import { createPortal } from "react-dom";

export function usePrint() {
  return useCallback(() => {
    window.print();
  }, []);
}

export function PrintArea({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  const el = document.getElementById("printArea");
  if (!el) return null;
  return createPortal(children, el);
}

export function PrintHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const now = new Date().toLocaleString("pt-BR");
  return (
    <div style={{ borderBottom: "2px solid #111827", marginBottom: 18, paddingBottom: 12 }}>
      <p style={{ fontSize: 12, fontWeight: 700, margin: "0 0 4px" }}>DOMINA</p>
      <h1 style={{ fontSize: 24, margin: 0 }}>{title}</h1>
      <p style={{ fontSize: 12, margin: "6px 0 0" }}>
        {subtitle ? `${subtitle} | ` : ""}Gerado em {now}
      </p>
    </div>
  );
}
