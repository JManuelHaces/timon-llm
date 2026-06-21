"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Square, Trash2, Compass } from "lucide-react";
import { useTimon, type Message } from "@/lib/store";
import { cn } from "@/lib/cn";

const MODES = [
  { id: "respuesta", label: "Responder" },
  { id: "reescritura", label: "Reescribir" },
] as const;

export function ChatStream() {
  const { messages, input, isStreaming, mode, setInput, setMode, send, stop, clearChat } =
    useTimon();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <section className="glass flex h-[calc(100vh-7.5rem)] flex-col">
      {/* cabecera */}
      <header className="flex items-center justify-between gap-3 border-b border-hull-border/60 p-4">
        <div className="inline-flex rounded-xl border border-hull-border/70 bg-abyss-800/60 p-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "relative rounded-lg px-4 py-1.5 text-xs font-medium transition-colors",
                mode === m.id ? "text-abyss-900" : "text-foam-dim hover:text-foam",
              )}
            >
              {mode === m.id && (
                <motion.span
                  layoutId="mode-pill"
                  className="absolute inset-0 rounded-lg bg-brass-sheen shadow-brass"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{m.label}</span>
            </button>
          ))}
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-foam-faint transition hover:text-coral"
          >
            <Trash2 size={13} /> Limpiar
          </button>
        )}
      </header>

      {/* mensajes */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 ? <EmptyState /> : null}
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <Bubble key={m.id} m={m} streaming={isStreaming} />
          ))}
        </AnimatePresence>
      </div>

      {/* entrada */}
      <div className="border-t border-hull-border/60 p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-hull-border/70 bg-abyss-800/60 p-2 transition focus-within:border-tide/40 focus-within:shadow-glow">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            placeholder="Escribe y deja que el timón module el tono…"
            className="max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foam placeholder:text-foam-faint focus:outline-none"
          />
          {isStreaming ? (
            <button
              onClick={stop}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-coral/90 text-white transition hover:bg-coral"
              aria-label="Detener"
            >
              <Square size={15} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={send}
              disabled={!input.trim()}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brass-sheen text-abyss-900 shadow-brass transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
              aria-label="Enviar"
            >
              <ArrowUp size={17} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full flex-col items-center justify-center gap-3 text-center"
    >
      <Compass className="animate-spin-slow text-brass/70" size={48} strokeWidth={1.2} />
      <p className="font-display text-lg text-foam">Toma el timón del tono</p>
      <p className="max-w-xs text-sm text-foam-faint">
        Ajusta las perillas de la izquierda y escribe un mensaje. La voz se moldea en tiempo real.
      </p>
    </motion.div>
  );
}

function Bubble({ m, streaming }: { m: Message; streaming: boolean }) {
  const isUser = m.role === "user";
  const isEmpty = !m.content && m.role === "assistant";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-br-md bg-tide/15 text-foam ring-1 ring-tide/25"
            : "rounded-bl-md bg-hull-light/80 text-foam ring-1 ring-hull-border/60",
        )}
      >
        {isEmpty ? (
          <span className="inline-flex gap-1 py-1">
            <Dot delay={0} /> <Dot delay={0.15} /> <Dot delay={0.3} />
          </span>
        ) : (
          <>
            {m.content}
            {streaming && m.role === "assistant" && (
              <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-blink bg-brass" />
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <motion.span
      className="inline-block h-1.5 w-1.5 rounded-full bg-foam-dim"
      animate={{ opacity: [0.2, 1, 0.2] }}
      transition={{ duration: 1, repeat: Infinity, delay }}
    />
  );
}
