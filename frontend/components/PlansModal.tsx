"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Check, Zap, Sparkles, MessageSquare, BarChart3,
  ShieldCheck, Headphones, Infinity, Lock, Bookmark,
} from "lucide-react";
import { cn } from "@/lib/cn";

type Plan = "freemium" | "pro";

const PLANS = [
  {
    id: "freemium" as Plan,
    name: "Freemium",
    price: null,
    badge: "Actual",
    tagline: "Para explorar y hacer pruebas de concepto",
    color: "border-brass/30 bg-gradient-to-b from-brass/8 to-transparent",
    badgeColor: "bg-brass/15 text-brass border-brass/30",
    ctaColor: "border border-hull-border/70 text-foam-dim hover:border-hull-border hover:text-foam",
    features: [
      { icon: MessageSquare, text: "10 interacciones de chat al día", included: true },
      { icon: Bookmark, text: "Hasta 3 rumbos guardados", included: true },
      { icon: Zap, text: "Streaming token a token", included: true },
      { icon: BarChart3, text: "Sonda de features básica", included: true },
      { icon: ShieldCheck, text: "SSO con Google", included: true },
      { icon: Infinity, text: "Interacciones ilimitadas", included: false },
      { icon: Sparkles, text: "Rumbos ilimitados", included: false },
      { icon: Headphones, text: "Soporte prioritario", included: false },
    ],
  },
  {
    id: "pro" as Plan,
    name: "Pro",
    price: 15,
    badge: "Recomendado",
    tagline: "Acceso completo sin límites por LLM conectado",
    color: "border-tide/40 bg-gradient-to-b from-tide/10 to-transparent",
    badgeColor: "bg-tide/15 text-tide border-tide/30",
    ctaColor: "bg-tide text-abyss-900 shadow-[0_0_20px_rgba(45,212,191,0.25)] hover:brightness-110",
    features: [
      { icon: MessageSquare, text: "10 interacciones de chat al día", included: false },
      { icon: Bookmark, text: "Hasta 3 rumbos guardados", included: false },
      { icon: Zap, text: "Streaming token a token", included: true },
      { icon: BarChart3, text: "Sonda de features avanzada", included: true },
      { icon: ShieldCheck, text: "SSO con Google", included: true },
      { icon: Infinity, text: "Interacciones ilimitadas", included: true },
      { icon: Sparkles, text: "Rumbos ilimitados", included: true },
      { icon: Headphones, text: "Soporte prioritario", included: true },
    ],
  },
];

export function PlansModal({
  open,
  onClose,
  currentPlan,
  onUpgrade,
}: {
  open: boolean;
  onClose: () => void;
  currentPlan: string;
  onUpgrade: (plan: Plan) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  const handleUpgrade = async () => {
    setConfirming(true);
    await onUpgrade("pro");
    setConfirming(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="plans-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-abyss-900/85 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            key="plans-modal"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-hull-border/70 bg-hull/90 shadow-panel backdrop-blur-xl"
            style={{ maxHeight: "min(90vh, 700px)" }}
          >
            {/* Header */}
            <div className="relative overflow-hidden border-b border-hull-border/50 px-6 py-5 text-center">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(60% 80% at 50% 0%, rgba(45,212,191,0.08) 0%, transparent 100%)",
                }}
              />
              <button
                onClick={onClose}
                className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-foam-faint transition hover:bg-hull-border/40 hover:text-foam"
              >
                <X size={15} />
              </button>
              <p className="text-[11px] uppercase tracking-[0.22em] text-tide">Planes de Timón</p>
              <h2 className="mt-1 font-display text-xl font-bold text-foam">
                Elige el plan que se adapta a ti
              </h2>
              <p className="mt-1 text-sm text-foam-dim">
                Precio por LLM conectado · sin permanencia · cancela cuando quieras
              </p>
            </div>

            {/* Cards */}
            <div className="grid flex-1 gap-4 overflow-y-auto p-6 sm:grid-cols-2">
              {PLANS.map((plan, i) => {
                const isCurrent = plan.id === currentPlan;
                const isUpgrade = plan.id === "pro" && currentPlan === "freemium";

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className={cn(
                      "relative flex flex-col rounded-2xl border p-5 transition",
                      plan.color,
                      isUpgrade && "ring-1 ring-tide/30",
                    )}
                  >
                    {/* Badge */}
                    <span className={cn(
                      "mb-3 inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      plan.badgeColor,
                    )}>
                      {isCurrent ? "Plan actual" : plan.badge}
                    </span>

                    {/* Price */}
                    <div className="mb-1 flex items-end gap-1">
                      {plan.price ? (
                        <>
                          <span className="font-display text-3xl font-bold text-foam">${plan.price}</span>
                          <span className="mb-1 text-sm text-foam-faint">/ mes · por LLM</span>
                        </>
                      ) : (
                        <span className="font-display text-3xl font-bold text-foam">Gratis</span>
                      )}
                    </div>
                    <p className="mb-4 text-[12px] leading-snug text-foam-dim">{plan.tagline}</p>

                    {/* Features */}
                    <ul className="mb-5 flex-1 space-y-2">
                      {plan.features.map((f) => (
                        <li key={f.text} className={cn("flex items-center gap-2 text-[12px]", f.included ? "text-foam-dim" : "text-foam-faint/50 line-through decoration-foam-faint/30")}>
                          {f.included
                            ? <Check size={12} className="shrink-0 text-tide" />
                            : <Lock size={11} className="shrink-0 text-foam-faint/40" />
                          }
                          {f.text}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    {isCurrent ? (
                      <div className="rounded-xl border border-hull-border/50 py-2.5 text-center text-xs text-foam-faint">
                        Plan activo
                      </div>
                    ) : (
                      <button
                        onClick={handleUpgrade}
                        disabled={confirming}
                        className={cn(
                          "rounded-xl py-2.5 text-sm font-semibold transition",
                          plan.ctaColor,
                          confirming && "opacity-60",
                        )}
                      >
                        {confirming ? "Procesando…" : `Pasarme a ${plan.name}`}
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-hull-border/50 px-6 py-3 text-center text-[11px] text-foam-faint">
              Los pagos se procesan de forma segura. Puedes cancelar en cualquier momento desde tu perfil.
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
