"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Mail, Lock, Loader2, Anchor } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function RegisterModal({ open, onClose }: Props) {
  const router = useRouter();
  const { register, loading, error, user, clearError } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState("");

  // Al loguear exitosamente, redirige y cierra.
  useEffect(() => {
    if (user) {
      onClose();
      router.replace("/timon");
    }
  }, [user, onClose, router]);

  // Limpiar errores del store al abrir/cerrar.
  useEffect(() => {
    clearError();
    setLocalError("");
    setName("");
    setEmail("");
    setPassword("");
    setConfirm("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    if (!name.trim() || !email.trim() || !password.trim()) {
      setLocalError("Todos los campos son obligatorios");
      return;
    }
    if (password.length < 6) {
      setLocalError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirm) {
      setLocalError("Las contraseñas no coinciden");
      return;
    }
    try {
      await register(name, email, password);
    } catch {
      // error ya lo muestra el store
    }
  };

  const displayError = localError || error;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-abyss-900/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 grid place-items-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="glass w-full max-w-[420px] p-7"
            >
              {/* Cabecera */}
              <div className="mb-5 flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-tide/10">
                    <Anchor size={17} className="text-tide" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-foam">Crear cuenta</h2>
                    <p className="text-[11px] text-foam-faint">Acceso freemium · sin tarjeta</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="grid h-8 w-8 place-items-center rounded-lg text-foam-faint transition hover:bg-hull-border/50 hover:text-foam"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="hairline mb-5" />

              <form onSubmit={onSubmit} className="space-y-3">
                <Field icon={<User size={14} />} label="Nombre completo">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    autoComplete="name"
                    className="w-full bg-transparent text-sm text-foam placeholder:text-foam-faint focus:outline-none"
                  />
                </Field>

                <Field icon={<Mail size={14} />} label="Correo electrónico">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    autoComplete="username"
                    className="w-full bg-transparent text-sm text-foam placeholder:text-foam-faint focus:outline-none"
                  />
                </Field>

                <Field icon={<Lock size={14} />} label="Contraseña">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    className="w-full bg-transparent text-sm text-foam placeholder:text-foam-faint focus:outline-none"
                  />
                </Field>

                <Field icon={<Lock size={14} />} label="Confirmar contraseña">
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repite la contraseña"
                    autoComplete="new-password"
                    className={cn(
                      "w-full bg-transparent text-sm placeholder:text-foam-faint focus:outline-none",
                      confirm && confirm !== password ? "text-coral" : "text-foam",
                    )}
                  />
                </Field>

                {displayError && (
                  <p className="rounded-lg border border-coral/30 bg-coral/5 px-3 py-2 text-xs text-coral">
                    {displayError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-tide/90 py-3 text-sm font-semibold text-abyss-900 shadow-glow transition hover:bg-tide disabled:opacity-60"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : "Crear cuenta"}
                </button>
              </form>

              <p className="mt-4 text-center text-[11px] text-foam-faint">
                Al registrarte aceptas los términos del servicio.
                Tu cuenta empieza en plan <span className="text-brass">freemium</span>.
              </p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-foam-faint">{label}</label>
      <div className="flex items-center gap-2.5 rounded-xl border border-hull-border/70 bg-abyss-800/60 px-3.5 py-2.5 transition focus-within:border-tide/40 focus-within:shadow-glow">
        <span className="text-foam-faint">{icon}</span>
        {children}
      </div>
    </div>
  );
}
