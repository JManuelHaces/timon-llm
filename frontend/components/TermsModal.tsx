"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X, ScrollText } from "lucide-react";

const SECTIONS = [
  {
    title: "1. Aceptación de los términos",
    body: "Al acceder y utilizar Timón, aceptas quedar vinculado por estos Términos y Condiciones. Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder al servicio.",
  },
  {
    title: "2. Descripción del servicio",
    body: "Timón es una plataforma de middleware de voz que permite controlar el tono de comunicación de modelos de lenguaje (LLM) mediante parámetros configurables: formalidad, urgencia, calidez y nivel de detalle. El servicio se ofrece «tal cual» y puede ser modificado o discontinuado en cualquier momento.",
  },
  {
    title: "3. Cuentas de usuario",
    body: "Eres responsable de mantener la confidencialidad de tus credenciales de acceso y de todas las actividades realizadas desde tu cuenta. Debes notificarnos inmediatamente de cualquier uso no autorizado. No está permitido compartir cuentas entre múltiples personas.",
  },
  {
    title: "4. Uso aceptable",
    body: "El servicio está destinado exclusivamente a uso legítimo y profesional. Está prohibido utilizar Timón para generar contenido ilegal, engañoso, discriminatorio o que vulnere derechos de terceros. Nos reservamos el derecho de suspender cuentas que violen esta política.",
  },
  {
    title: "5. Privacidad y datos",
    body: "Recopilamos únicamente los datos necesarios para prestar el servicio: correo electrónico, nombre y preferencias de configuración. No vendemos ni compartimos tus datos con terceros con fines comerciales. Los datos de sesión se almacenan de forma cifrada.",
  },
  {
    title: "6. Propiedad intelectual",
    body: "Todo el código, diseño y documentación de Timón es propiedad de sus autores y está protegido por las leyes de propiedad intelectual aplicables. El acceso al servicio no te otorga derechos sobre la propiedad intelectual de la plataforma.",
  },
  {
    title: "7. Limitación de responsabilidad",
    body: "En ningún caso seremos responsables de daños indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de uso del servicio. Nuestra responsabilidad máxima se limita al importe abonado por el usuario en los últimos 12 meses.",
  },
  {
    title: "8. Modificaciones",
    body: "Nos reservamos el derecho de modificar estos términos en cualquier momento. Notificaremos los cambios significativos a través del correo registrado o mediante un aviso destacado en la plataforma. El uso continuado del servicio tras la notificación implica la aceptación de los nuevos términos.",
  },
  {
    title: "9. Legislación aplicable",
    body: "Estos términos se rigen por la legislación vigente en el territorio donde opera el servicio. Cualquier disputa se someterá a la jurisdicción exclusiva de los tribunales competentes.",
  },
  {
    title: "10. Contacto",
    body: "Para cualquier consulta relacionada con estos términos, puedes contactarnos a través de los canales oficiales indicados en la plataforma.",
  },
];

export function TermsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="terms-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-abyss-900/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="terms-modal"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed inset-x-4 bottom-0 top-[5vh] z-50 mx-auto flex max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-hull-border/70 bg-hull/90 shadow-panel backdrop-blur-xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:rounded-2xl sm:top-[8vh] sm:bottom-[8vh] sm:w-full"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-hull-border/50 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-brass/10">
                  <ScrollText size={14} className="text-brass" />
                </span>
                <div>
                  <h2 className="font-display text-base font-bold text-foam">Términos y Condiciones</h2>
                  <p className="text-[11px] text-foam-faint">Última actualización: junio 2025</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-lg text-foam-faint transition hover:bg-hull-border/40 hover:text-foam"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5 text-sm leading-relaxed text-foam-dim">
              <p className="mb-5 text-[13px] text-foam-dim">
                Bienvenido a <span className="font-semibold text-foam">Timón</span>. Lee detenidamente los siguientes términos antes de utilizar el servicio.
              </p>

              <div className="space-y-5">
                {SECTIONS.map((s) => (
                  <div key={s.title}>
                    <h3 className="mb-1.5 text-[13px] font-semibold text-foam">{s.title}</h3>
                    <p className="text-[13px] leading-relaxed text-foam-dim">{s.body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-hull-border/50 px-6 py-4">
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-brass-sheen py-2.5 text-sm font-semibold text-abyss-900 shadow-brass transition hover:brightness-110"
              >
                Entendido
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
