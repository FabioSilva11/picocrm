import { useEffect, useState, type ReactNode } from "react";
import { Lock, MessageCircle, X, ChevronRight, Zap, Wrench, Bug } from "lucide-react";

const KEY  = "domina_gate_ok";
const PASS = "admin123";

const DEV_PHONE = "5597984306291";

type ServiceType = "redesign" | "feature" | "bug" | null;

const services: {
  type: ServiceType;
  icon: React.ReactNode;
  label: string;
  price: string;
  description: string;
  color: string;
  iconBg: string;
  message: string;
}[] = [
  {
    type: "redesign",
    icon: <Zap className="h-5 w-5" />,
    label: "Atualizar / Redesign",
    price: "R$ 200",
    description: "Melhorias visuais, layout ou identidade",
    color: "border-violet-300 hover:border-violet-500 hover:bg-violet-500/5",
    iconBg: "bg-violet-500/10 text-violet-600",
    message:
      "Olá! Gostaria de solicitar um *Redesign / Atualização* no sistema DOMINA CRM.\n\nValor: R$ 200\n\nPode me passar mais detalhes sobre disponibilidade?",
  },
  {
    type: "feature",
    icon: <Wrench className="h-5 w-5" />,
    label: "Adicionar funcionalidade",
    price: "R$ 300",
    description: "Nova tela, integração ou recurso",
    color: "border-sky-300 hover:border-sky-500 hover:bg-sky-500/5",
    iconBg: "bg-sky-500/10 text-sky-600",
    message:
      "Olá! Gostaria de solicitar a *adição de uma nova funcionalidade* no sistema DOMINA CRM.\n\nValor: R$ 300\n\nPode me passar mais detalhes sobre disponibilidade?",
  },
  {
    type: "bug",
    icon: <Bug className="h-5 w-5" />,
    label: "Corrigir bug",
    price: "R$ 70",
    description: "Correção de erro ou comportamento inesperado",
    color: "border-rose-300 hover:border-rose-500 hover:bg-rose-500/5",
    iconBg: "bg-rose-500/10 text-rose-600",
    message:
      "Olá! Preciso de suporte para *correção de um bug* no sistema DOMINA CRM.\n\nValor: R$ 70\n\nPode me passar mais detalhes sobre disponibilidade?",
  },
];

function SupportModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<ServiceType>(null);

  const handleWhatsApp = () => {
    const svc = services.find((s) => s.type === selected);
    if (!svc) return;
    const text = encodeURIComponent(svc.message);
    window.open(`https://wa.me/${DEV_PHONE}?text=${text}`, "_blank");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Suporte</p>
            <h2 className="text-lg font-black">Como posso ajudar?</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Opções */}
        <div className="space-y-3 p-6">
          <p className="text-sm text-muted-foreground">
            Selecione o tipo de serviço desejado:
          </p>
          {services.map((svc) => (
            <button
              key={svc.type}
              onClick={() => setSelected(svc.type)}
              className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                selected === svc.type
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : svc.color
              }`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${svc.iconBg}`}>
                {svc.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{svc.label}</p>
                <p className="text-xs text-muted-foreground">{svc.description}</p>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-black tabular-nums">
                {svc.price}
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4">
          <button
            onClick={handleWhatsApp}
            disabled={!selected}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow hover:bg-[#1ebe5d] disabled:opacity-40 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Ir para o WhatsApp
            <ChevronRight className="h-4 w-4" />
          </button>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Você será redirecionado com uma mensagem pré-preenchida.
          </p>
        </div>
      </div>
    </div>
  );
}

export function PasswordGate({ children }: { children: ReactNode }) {
  const [ok, setOk]       = useState(false);
  const [pw, setPw]       = useState("");
  const [err, setErr]     = useState(false);
  const [ready, setReady] = useState(false);
  const [modal, setModal] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOk(sessionStorage.getItem(KEY) === "1");
      setReady(true);
    }
  }, []);

  if (!ready) return null;

  if (ok) return <>{children}</>;

  return (
    <>
      {modal && <SupportModal onClose={() => setModal(false)} />}

      <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4">

        {/* Fundo decorativo */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, hsl(var(--primary)) 0%, transparent 60%), radial-gradient(circle at 80% 70%, hsl(var(--primary)) 0%, transparent 60%)",
          }}
        />

        <div className="relative w-full max-w-sm space-y-6">

          {/* Card principal */}
          <div className="rounded-2xl border bg-surface p-8 shadow-xl">

            {/* Logo / cabeçalho */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                <Lock className="h-7 w-7" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">DOMINA</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight">CRM de Peças</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Bem-vindo! Informe sua senha para acessar o painel.
              </p>
            </div>

            {/* Formulário */}
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
              className="space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  Senha de acesso
                </label>
                <input
                  type="password"
                  autoFocus
                  value={pw}
                  onChange={(e) => {
                    setPw(e.target.value);
                    setErr(false);
                  }}
                  className={`w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary ${
                    err ? "border-destructive" : ""
                  }`}
                  placeholder="••••••••"
                />
                {err && (
                  <p className="mt-1.5 text-xs font-semibold text-destructive">
                    Senha incorreta. Tente novamente.
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Entrar no painel
                <ChevronRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Card de suporte do desenvolvedor */}
          <div className="rounded-2xl border bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#25D366]">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold">Suporte da plataforma</p>
                <p className="text-[11px] text-muted-foreground">
                  Desenvolvido por Fábio Silva
                </p>
              </div>
              <button
                onClick={() => setModal(true)}
                className="shrink-0 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1ebe5d] transition-colors"
              >
                Falar
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
