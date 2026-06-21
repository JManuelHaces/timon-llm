"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, User, Mail, Shield, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { LogoutOverlay } from "./LogoutOverlay";
import { cn } from "@/lib/cn";

const ROLE_LABEL: Record<string, string> = {
  freemium: "Freemium",
  pro: "Pro",
  admin: "Admin",
};

const ROLE_COLOR: Record<string, string> = {
  freemium: "text-brass bg-brass/10 border-brass/25",
  pro: "text-tide bg-tide/10 border-tide/25",
  admin: "text-coral bg-coral/10 border-coral/25",
};

export function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al click fuera.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;

  const avatar = user.picture
    ? <img src={user.picture} alt="" className="h-8 w-8 rounded-full object-cover" referrerPolicy="no-referrer" />
    : (
      <span className="grid h-8 w-8 place-items-center rounded-full bg-brass-sheen text-xs font-bold text-abyss-900">
        {user.name.charAt(0).toUpperCase()}
      </span>
    );

  const handleLogout = async () => {
    setOpen(false);
    setLoggingOut(true);
    await new Promise((r) => setTimeout(r, 1600));
    logout();
    router.replace("/");
  };

  const handleProfile = () => {
    setOpen(false);
    router.push("/timon/perfil");
  };

  return (
    <>
      <LogoutOverlay visible={loggingOut} />

      <div ref={ref} className="relative">
        {/* Trigger */}
        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex items-center gap-2 rounded-full border py-1 pl-1 pr-2.5 backdrop-blur transition",
            open
              ? "border-brass/50 bg-hull-light shadow-brass"
              : "border-hull-border/60 bg-hull/50 hover:border-hull-border",
          )}
        >
          {avatar}
          <span className="hidden max-w-[110px] truncate text-xs text-foam-dim sm:block">
            {user.name || user.email}
          </span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={13} className="text-foam-faint" />
          </motion.span>
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-2xl border border-hull-border/70 bg-hull/80 shadow-panel backdrop-blur-xl"
            >
              {/* Info de usuario */}
              <div className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="shrink-0">{avatar}</div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foam">{user.name || "Sin nombre"}</p>
                    <p className="truncate text-[11px] text-foam-faint">{user.email}</p>
                  </div>
                </div>

                {/* Datos informativos */}
                <div className="mt-3 space-y-1.5">
                  <InfoRow icon={<Mail size={11} />} label="Correo" value={user.email} />
                  <InfoRow icon={<Shield size={11} />} label="Rol">
                    <span className={cn("rounded-md border px-1.5 py-0.5 text-[10px] font-medium", ROLE_COLOR[user.role] ?? ROLE_COLOR.freemium)}>
                      {ROLE_LABEL[user.role] ?? user.role}
                    </span>
                  </InfoRow>
                </div>
              </div>

              <div className="hairline mx-3" />

              {/* Acciones */}
              <div className="p-1.5">
                <MenuItem icon={<User size={14} />} onClick={handleProfile}>
                  Mi perfil
                </MenuItem>
              </div>

              <div className="hairline mx-3" />

              <div className="p-1.5">
                <MenuItem icon={<LogOut size={14} />} onClick={handleLogout} danger>
                  Cerrar sesión
                </MenuItem>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

function InfoRow({
  icon, label, value, children,
}: {
  icon: React.ReactNode; label: string; value?: string; children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1 text-[11px] text-foam-faint">
        {icon} {label}
      </span>
      {children ?? <span className="max-w-[130px] truncate text-right text-[11px] text-foam-dim">{value}</span>}
    </div>
  );
}

function MenuItem({
  icon, onClick, children, danger = false,
}: {
  icon: React.ReactNode; onClick: () => void; children: React.ReactNode; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition",
        danger
          ? "text-foam-dim hover:bg-coral/10 hover:text-coral"
          : "text-foam-dim hover:bg-hull-border/40 hover:text-foam",
      )}
    >
      {icon} {children}
    </button>
  );
}
