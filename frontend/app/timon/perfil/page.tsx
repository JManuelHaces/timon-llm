"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Save, Loader2, User, Mail, Shield,
  Check, Pencil, Anchor, Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { http } from "@/lib/api";
import { AuthGuard } from "@/components/AuthGuard";
import { Logo } from "@/components/Logo";
import { PlansModal } from "@/components/PlansModal";
import { cn } from "@/lib/cn";

const ROLE_META: Record<string, { label: string; desc: string; color: string }> = {
  freemium: { label: "Freemium", desc: "Plan gratuito · funciones esenciales", color: "from-brass/20 to-brass/5 border-brass/30 text-brass" },
  pro: { label: "Pro", desc: "Acceso completo · sin límites", color: "from-tide/20 to-tide/5 border-tide/30 text-tide" },
  admin: { label: "Admin", desc: "Administrador del sistema", color: "from-coral/20 to-coral/5 border-coral/30 text-coral" },
};

function ProfilePage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [picture, setPicture] = useState(user?.picture ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [editingPicture, setEditingPicture] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);

  const role = user?.role ?? "freemium";
  const roleMeta = ROLE_META[role] ?? ROLE_META.freemium;

  const save = async () => {
    if (!name.trim()) { setError("El nombre no puede estar vacío"); return; }
    setSaving(true);
    setError("");
    try {
      const { data } = await http.patch<typeof user>("/api/auth/me", { name: name.trim(), picture: picture.trim() });
      // Actualiza el store local con los datos frescos del servidor.
      useAuth.setState((s) => ({ user: s.user ? { ...s.user, ...data } : s.user }));
      setSaved(true);
      setEditingName(false);
      setEditingPicture(false);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleUpgrade = async (plan: "freemium" | "pro") => {
    try {
      const { data } = await http.patch<typeof user>("/api/auth/me/role", { role: plan });
      useAuth.setState((s) => ({ user: s.user ? { ...s.user, ...data } : s.user }));
      setPlansOpen(false);
    } catch {
      // silencioso — el plan se actualizará en el próximo refresco
      setPlansOpen(false);
    }
  };

  if (!user) return null;

  const initials = name.trim().split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <PlansModal
        open={plansOpen}
        onClose={() => setPlansOpen(false)}
        currentPlan={role}
        onUpgrade={handleUpgrade}
      />
    <div className="mx-auto min-h-screen max-w-[860px] px-6 py-6">
      {/* Cabecera */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 rounded-xl border border-hull-border/60 bg-hull/40 px-3 py-2 text-sm text-foam-dim transition hover:border-hull-border hover:text-foam"
        >
          <ArrowLeft size={14} /> Volver
        </button>
        <div className="flex items-center gap-2.5">
          <Logo size={28} spinning={false} />
          <span className="font-display text-lg font-semibold text-foam">Mi perfil</span>
        </div>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        {/* Columna izquierda: avatar + rol */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.06 }}
          className="flex flex-col gap-4"
        >
          {/* Avatar card */}
          <div className="glass flex flex-col items-center gap-4 p-6 text-center">
            <div className="relative">
              {picture ? (
                <img src={picture} alt="" className="h-24 w-24 rounded-full object-cover ring-2 ring-brass/30" referrerPolicy="no-referrer" />
              ) : (
                <div className="grid h-24 w-24 place-items-center rounded-full bg-brass-sheen text-3xl font-bold text-abyss-900 ring-2 ring-brass/30">
                  {initials || <User size={32} />}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-abyss-900 bg-tide text-abyss-900">
                <Anchor size={12} />
              </div>
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-foam">{name || "Sin nombre"}</p>
              <p className="mt-0.5 text-xs text-foam-faint">{user.email}</p>
            </div>
            {/* Badge rol */}
            <div className={cn("w-full rounded-xl border bg-gradient-to-b px-4 py-3", roleMeta.color)}>
              <p className={cn("font-display text-sm font-bold", roleMeta.color.split(" ").at(-1))}>
                {roleMeta.label}
              </p>
              <p className="mt-0.5 text-[11px] opacity-75">{roleMeta.desc}</p>
              {role === "freemium" && (
                <button
                  onClick={() => setPlansOpen(true)}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-tide/40 bg-tide/10 py-1.5 text-[11px] font-semibold text-tide transition hover:bg-tide/20"
                >
                  <Sparkles size={11} /> Mejorar plan
                </button>
              )}
            </div>
          </div>

          {/* Datos de solo lectura */}
          <div className="glass space-y-3 p-5">
            <h3 className="panel-label">Información de cuenta</h3>
            <InfoItem icon={<Mail size={13} />} label="Correo" value={user.email} />
            <InfoItem icon={<Shield size={13} />} label="Rol" value={roleMeta.label} />
            <InfoItem
              icon={<User size={13} />}
              label="Método"
              value={user.provider === "google" ? "Google SSO" : "Email y contraseña"}
            />
          </div>
        </motion.div>

        {/* Columna derecha: edición */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col gap-4"
        >
          {/* Nombre */}
          <div className="glass p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="panel-label flex items-center gap-1.5"><User size={12} /> Nombre público</h3>
              {!editingName && (
                <button onClick={() => setEditingName(true)} className="flex items-center gap-1 text-[11px] text-foam-faint transition hover:text-tide">
                  <Pencil size={11} /> Editar
                </button>
              )}
            </div>
            {editingName ? (
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-hull-border/70 bg-abyss-800/60 px-4 py-3 text-sm text-foam placeholder:text-foam-faint focus:border-tide/40 focus:outline-none focus:shadow-glow"
                placeholder="Tu nombre"
              />
            ) : (
              <p className="rounded-xl bg-abyss-800/40 px-4 py-3 text-sm text-foam">{name || <span className="text-foam-faint">Sin nombre</span>}</p>
            )}
          </div>

          {/* Avatar URL */}
          <div className="glass p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="panel-label flex items-center gap-1.5"><User size={12} /> URL de avatar</h3>
              {!editingPicture && (
                <button onClick={() => setEditingPicture(true)} className="flex items-center gap-1 text-[11px] text-foam-faint transition hover:text-tide">
                  <Pencil size={11} /> Editar
                </button>
              )}
            </div>
            {editingPicture ? (
              <input
                autoFocus
                value={picture}
                onChange={(e) => setPicture(e.target.value)}
                className="w-full rounded-xl border border-hull-border/70 bg-abyss-800/60 px-4 py-3 font-mono text-xs text-foam placeholder:text-foam-faint focus:border-tide/40 focus:outline-none"
                placeholder="https://..."
              />
            ) : (
              <p className="rounded-xl bg-abyss-800/40 px-4 py-3 font-mono text-xs text-foam break-all">
                {picture || <span className="text-foam-faint font-sans">Sin avatar personalizado</span>}
              </p>
            )}
          </div>

          {/* Botón guardar */}
          {(editingName || editingPicture) && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              {error && (
                <p className="mb-3 rounded-xl border border-coral/30 bg-coral/5 px-4 py-2.5 text-sm text-coral">{error}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => { setEditingName(false); setEditingPicture(false); setName(user.name); setPicture(user.picture); setError(""); }}
                  className="flex-1 rounded-xl border border-hull-border/70 py-3 text-sm text-foam-dim transition hover:text-foam"
                >
                  Cancelar
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brass-sheen py-3 text-sm font-semibold text-abyss-900 shadow-brass transition hover:brightness-110 disabled:opacity-60"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <><Check size={16} /> Guardado</> : <><Save size={16} /> Guardar cambios</>}
                </button>
              </div>
            </motion.div>
          )}

          {/* Zona de peligro */}
          <div className="glass border-coral/20 p-6">
            <h3 className="panel-label mb-3 text-coral/70">Zona de peligro</h3>
            <button
              onClick={async () => {
                logout();
                router.replace("/");
              }}
              className="flex items-center gap-2 rounded-xl border border-coral/30 px-4 py-2.5 text-sm text-coral/80 transition hover:border-coral/60 hover:bg-coral/5 hover:text-coral"
            >
              <ArrowLeft size={14} /> Cerrar sesión desde todos los dispositivos
            </button>
          </div>
        </motion.div>
      </div>
    </div>
    </>

  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-[11px] text-foam-faint">{icon} {label}</span>
      <span className="max-w-[160px] truncate text-right text-xs text-foam">{value}</span>
    </div>
  );
}

export default function PerfilPage() {
  return (
    <AuthGuard>
      <ProfilePage />
    </AuthGuard>
  );
}
