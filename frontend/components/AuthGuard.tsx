"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Logo } from "./Logo";

// Protege /timon: si no hay sesión (tras hidratar el store), vuelve al login.
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAuth((s) => s.user);
  const hydrated = useAuth((s) => s.hydrated);
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !user) router.replace("/");
  }, [hydrated, user, router]);

  if (!hydrated || !user) return <Splash />;
  return <>{children}</>;
}

function Splash() {
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="flex flex-col items-center gap-3">
        <Logo size={44} />
        <span className="font-display text-sm tracking-[0.2em] text-foam-faint">
          Trazando rumbo…
        </span>
      </div>
    </div>
  );
}
