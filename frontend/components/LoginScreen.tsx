"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Lock, Loader2, ArrowRight, UserPlus,
  SlidersHorizontal, Zap, ShieldCheck, BarChart3, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { initGoogle, promptGoogleOneTap, hasGoogleClientId } from "@/lib/google-sso";
import { RegisterModal } from "./RegisterModal";
import { TermsModal } from "./TermsModal";
import { Logo } from "./Logo";
import { cn } from "@/lib/cn";

type Method = "google" | "password";

// ── Google button ────────────────────────────────────────────────────────────

function GoogleButtonContainer({
  onCredential,
  loading,
}: {
  onCredential: (c: string) => void;
  loading: boolean;
}) {
  const [ready, setReady] = useState(false);
  const [tapping, setTapping] = useState(false);
  const hasClientId = hasGoogleClientId();

  useEffect(() => {
    if (!hasClientId) return;
    initGoogle(onCredential).then(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cuando el ciclo de auth termina (éxito o error), limpia el estado local
  useEffect(() => {
    if (!loading) setTapping(false);
  }, [loading]);

  const busy = loading || tapping;

  const handleClick = () => {
    if (busy) return;
    if (hasClientId && ready) {
      setTapping(true);
      promptGoogleOneTap(() => setTapping(false));
    } else {
      onCredential("");
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <button
        onClick={handleClick}
        disabled={busy || (hasClientId && !ready)}
        className={cn(
          "relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-white/8 bg-[#131314] px-4 py-3.5 text-sm font-medium transition-all",
          busy
            ? "cursor-not-allowed text-[#a0a0a0] opacity-70"
            : "text-[#e3e3e3] hover:border-white/15 hover:bg-[#1c1c1e] active:scale-[0.99]",
        )}
      >
        {/* Shimmer mientras espera */}
        {busy && (
          <span className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        )}
        <span className="shrink-0">
          {busy ? <Loader2 className="animate-spin" size={17} /> : <GoogleIcon />}
        </span>
        <span className="flex-1 text-center tracking-[0.01em]">
          {busy ? "Verificando…" : "Continuar con Google"}
        </span>
      </button>

      {!hasClientId && (
        <p className="rounded-lg border border-white/6 bg-white/3 px-3 py-2 text-center text-[11px] text-foam-faint">
          Sin <code className="font-mono text-brass/80">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> — modo demo activo
        </p>
      )}
    </div>
  );
}

// ── Features del banner ──────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: SlidersHorizontal,
    title: "Control total del tono",
    desc: "4 perillas en tiempo real: formalidad, urgencia, calidez y detalle.",
    color: "text-tide",
    bg: "bg-tide/10",
  },
  {
    icon: Zap,
    title: "Streaming token a token",
    desc: "Respuestas que fluyen al instante, sin esperar a que termine el modelo.",
    color: "text-brass",
    bg: "bg-brass/10",
  },
  {
    icon: BarChart3,
    title: "Sonda de features",
    desc: "Visibilidad interna sobre qué conceptos activa tu IA en cada respuesta.",
    color: "text-[#a78bfa]",
    bg: "bg-[#a78bfa]/10",
  },
  {
    icon: ShieldCheck,
    title: "SSO empresarial",
    desc: "Login con Google o credenciales propias. JWT con caducidad configurable.",
    color: "text-foam-dim",
    bg: "bg-hull-border/40",
  },
];

// ── Testimonial / stat cards ─────────────────────────────────────────────────

const STATS = [
  { value: "4×", label: "perillas de tono" },
  { value: "<50ms", label: "latencia streaming" },
  { value: "100%", label: "open source" },
];

// ── Banner izquierdo ─────────────────────────────────────────────────────────

function MarketingBanner() {
  return (
    <div className="relative flex h-full flex-col justify-center gap-7 overflow-hidden px-8 py-8">
      {/* Fondo: gradiente radial + cuadrícula */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 60% at 30% 30%, rgba(45,212,191,0.10) 0%, transparent 70%), radial-gradient(60% 50% at 70% 80%, rgba(224,168,90,0.10) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(to right,rgba(45,212,191,0.06) 1px,transparent 1px),linear-gradient(to bottom,rgba(45,212,191,0.06) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Headline */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="relative"
      >
        <h1 className="font-display text-[1.95rem] font-bold leading-[1.2] tracking-tight text-foam">
          Toma el timón<br />
          del <span className="bg-gradient-to-r from-brass to-tide bg-clip-text text-transparent">tono</span>{" "}
          de tu IA
        </h1>
        <p className="mt-3 max-w-sm text-[0.9rem] leading-relaxed text-foam-dim">
          Timón es el middleware de voz que convierte cualquier LLM en un
          comunicador adaptable. Controla formalidad, urgencia, calidez y
          detalle sin tocar el prompt.
        </p>

        {/* CTA secundario */}
        <button className="mt-4 flex items-center gap-1.5 text-sm font-medium text-tide transition hover:gap-2.5">
          Ver cómo funciona <ChevronRight size={15} />
        </button>
      </motion.div>

      {/* Feature list */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="relative space-y-2"
      >
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.32 + i * 0.07 }}
            className="flex items-center gap-3 rounded-xl border border-hull-border/50 bg-hull/40 px-3.5 py-2.5 backdrop-blur"
          >
            <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-lg", f.bg)}>
              <f.icon size={12} className={f.color} />
            </span>
            <div>
              <p className="text-[0.8rem] font-medium text-foam">{f.title}</p>
              <p className="text-[11px] leading-snug text-foam-faint">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="relative flex gap-6"
      >
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-display text-lg font-bold text-brass">{s.value}</p>
            <p className="text-[10px] text-foam-faint">{s.label}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ── Panel de login ───────────────────────────────────────────────────────────

export function LoginScreen() {
  const router = useRouter();
  const { user, hydrated, loading, error, loginWithGoogle, loginWithPassword } = useAuth();
  const [method, setMethod] = useState<Method>("google");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  useEffect(() => {
    if (hydrated && user) router.replace("/timon");
  }, [hydrated, user, router]);

  useEffect(() => {
    if (user) router.replace("/timon");
  }, [user, router]);

  const handleGoogleCredential = async (credential: string) => {
    try {
      await loginWithGoogle(credential);
    } catch {
      // error mostrado por el store
    }
  };

  const onPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginWithPassword(email, password);
  };

  return (
    <>
      <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} />
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />

      {/* Layout split: banner | login */}
      <div className="grid min-h-screen lg:grid-cols-[1fr_480px]">

        {/* ── Izquierda: banner ── */}
        <div className="hidden border-r border-hull-border/40 lg:block">
          <MarketingBanner />
        </div>

        {/* ── Derecha: formulario ── */}
        <div className="flex items-center justify-center bg-abyss-900/60 px-8 py-12 backdrop-blur">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.08 }}
            className="w-full max-w-[360px]"
          >
            {/* Wordmark — visible siempre en el panel de login */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mb-8 flex flex-col items-center text-center"
            >
              <Logo size={72} />
              <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-foam">Timón</h1>
              <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-foam-faint">Consola de voz IA</p>
            </motion.div>

            {/* Título del panel */}
            <div className="mb-5">
              <h2 className="font-display text-lg font-bold text-foam">Acceder</h2>
              <p className="mt-0.5 text-sm text-foam-dim">Elige cómo quieres entrar a bordo</p>
            </div>

            {/* Switch */}
            <div className="mb-5 inline-flex w-full rounded-xl border border-hull-border/70 bg-abyss-800/60 p-1">
              {(["google", "password"] as Method[]).map((m) => (
                <button
                  key={m}
                  onClick={() => !loading && setMethod(m)}
                  disabled={loading}
                  className={cn(
                    "relative flex-1 rounded-lg py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed",
                    method === m ? "text-abyss-900" : "text-foam-dim hover:text-foam",
                  )}
                >
                  {method === m && (
                    <motion.span
                      layoutId="login-pill"
                      className="absolute inset-0 rounded-lg bg-brass-sheen shadow-brass"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">
                    {m === "google" ? "Google" : "Contraseña"}
                  </span>
                </button>
              ))}
            </div>

            {/* Contenido del tab */}
            <AnimatePresence mode="wait">
              {method === "google" ? (
                <motion.div
                  key="google"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.16 }}
                  className="flex flex-col items-center"
                >
                  <GoogleButtonContainer
                    onCredential={handleGoogleCredential}
                    loading={loading}
                  />
                </motion.div>
              ) : (
                <motion.form
                  key="password"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.16 }}
                  onSubmit={onPassword}
                  className="space-y-3"
                >
                  <Field icon={<Mail size={14} />} placeholder="usuario@correo.com" type="email" value={email} onChange={setEmail} autoComplete="username" />
                  <Field icon={<Lock size={14} />} placeholder="Contraseña" type="password" value={password} onChange={setPassword} autoComplete="current-password" />

                  <button
                    type="submit"
                    disabled={loading}
                    className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-brass-sheen py-3 text-sm font-semibold text-abyss-900 shadow-brass transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading && (
                      <span className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    )}
                    {loading
                      ? <><Loader2 className="animate-spin" size={15} /> Verificando…</>
                      : <>Entrar <ArrowRight size={15} /></>}
                  </button>

                  <div className="hairline" />

                  <button
                    type="button"
                    onClick={() => !loading && setRegisterOpen(true)}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-tide/40 py-2.5 text-sm font-medium text-tide transition hover:bg-tide/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <UserPlus size={14} /> Crear cuenta nueva
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {error && (
              <p className="mt-3 rounded-lg border border-coral/30 bg-coral/5 px-3 py-2 text-center text-xs text-coral">
                {error}
              </p>
            )}

            <p className="mt-5 text-center text-[11px] text-foam-faint">
              {hasGoogleClientId()
                ? "Tu sesión se verifica con los servidores de Google."
                : "Demo · cualquier credencial es válida sin Client ID."}
            </p>

            <p className="mt-3 text-center text-[11px] text-foam-faint">
              Al acceder aceptas nuestros{" "}
              <button
                onClick={() => setTermsOpen(true)}
                className="text-brass underline-offset-2 transition hover:text-brass/80 hover:underline"
              >
                Términos y Condiciones
              </button>
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Field({
  icon, placeholder, type, value, onChange, autoComplete,
}: {
  icon: React.ReactNode;
  placeholder: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <label className="flex items-center gap-2.5 rounded-xl border border-hull-border/70 bg-abyss-800/60 px-3.5 py-3 transition focus-within:border-tide/40 focus-within:shadow-glow">
      <span className="text-foam-faint">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full bg-transparent text-sm text-foam placeholder:text-foam-faint focus:outline-none"
      />
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
