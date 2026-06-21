"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Logo } from "./Logo";
import { UserMenu } from "./UserMenu";
import { http, API_URL } from "@/lib/api";
import { cn } from "@/lib/cn";

type Status = "checking" | "online" | "offline";

export function Header() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let alive = true;
    http
      .get("/api/presets")
      .then(() => alive && setStatus("online"))
      .catch(() => alive && setStatus("offline"));
    return () => { alive = false; };
  }, []);

  const dot =
    status === "online" ? "bg-tide" : status === "offline" ? "bg-coral" : "bg-brass";
  const label =
    status === "online" ? "Motor conectado" : status === "offline" ? "Sin motor" : "Conectando…";

  return (
    <header className="flex items-center justify-between px-6 py-4">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Logo size={38} />
        <div className="leading-none">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foam">Timón</h1>
          <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-foam-faint">
            Consola de voz
          </p>
        </div>
      </motion.div>

      <div className="flex items-center gap-3">
        {/* Indicador de motor */}
        <div
          className="flex items-center gap-2 rounded-full border border-hull-border/60 bg-hull/50 px-3 py-1.5 backdrop-blur"
          title={API_URL}
        >
          <span className="relative flex h-2 w-2">
            <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-60", dot, status !== "offline" && "animate-ping")} />
            <span className={cn("relative inline-flex h-2 w-2 rounded-full", dot)} />
          </span>
          <span className="text-[11px] text-foam-dim">{label}</span>
        </div>

        {/* Menú de usuario */}
        <UserMenu />
      </div>
    </header>
  );
}
