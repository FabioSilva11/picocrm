import { useEffect, useState, type ReactNode } from "react";
import { Lock } from "lucide-react";

const KEY = "domina_gate_ok";
const PASS = "admin123";

export function PasswordGate({ children }: { children: ReactNode }) {
  const [ok, setOk] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOk(sessionStorage.getItem(KEY) === "1");
      setReady(true);
    }
  }, []);

  if (!ready) return null;

  if (!ok) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pw === PASS) {
              sessionStorage.setItem(KEY, "1");
              setOk(true);
            } else {
              setErr(true);
            }
          }}
          className="w-full max-w-sm rounded-xl border bg-surface p-8 shadow-lg"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">DOMINA</p>
              <h1 className="text-lg font-black leading-tight">Acesso ao CRM</h1>
            </div>
          </div>
          <label className="block text-xs font-semibold text-muted-foreground">Senha</label>
          <input
            type="password"
            autoFocus
            value={pw}
            onChange={(e) => {
              setPw(e.target.value);
              setErr(false);
            }}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="••••••••"
          />
          {err && <p className="mt-2 text-xs font-semibold text-destructive">Senha incorreta.</p>}
          <button
            type="submit"
            className="mt-4 w-full rounded-md bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
