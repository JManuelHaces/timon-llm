"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./Logo";

// Pantalla de cierre de sesión: cubre la UI, muestra el timón girando
// y un mensaje elegante mientras se limpia la sesión y se redirige.
export function LogoutOverlay({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-abyss-900/95 backdrop-blur-xl"
        >
          {/* Halo de fondo */}
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="h-[480px] w-[480px] rounded-full bg-brass/5 blur-[120px]" />
          </div>

          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.08, type: "spring", stiffness: 260, damping: 22 }}
            className="relative flex flex-col items-center gap-5"
          >
            <Logo size={64} spinning />

            <div className="text-center">
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                className="font-display text-xl font-semibold tracking-tight text-foam"
              >
                Cerrando sesión
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.38 }}
                className="mt-1 text-sm text-foam-faint"
              >
                El timón vuelve al centro…
              </motion.p>
            </div>

            {/* Barra de progreso indeterminada */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="relative h-[2px] w-40 overflow-hidden rounded-full bg-hull-border/60"
            >
              <motion.div
                className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-brass"
                animate={{ x: ["−100%", "200%"] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
