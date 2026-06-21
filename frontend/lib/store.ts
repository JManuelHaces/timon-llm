// Estado global de Timón (Zustand). Una sola fuente de verdad para las perillas,
// el modo y la conversación. Los componentes leen/escriben aquí; nada de prop-drilling.
import { create } from "zustand";
import { streamChat, type Knobs, type Mode } from "./api";

export type KnobName = keyof Knobs;

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  knobs?: Knobs;
};

export const DEFAULT_KNOBS: Knobs = { formality: 50, urgency: 50, warmth: 50, detail: 50 };

export const KNOB_META: Record<KnobName, { label: string; low: string; high: string }> = {
  formality: { label: "Formalidad", low: "Cercano", high: "Protocolar" },
  urgency: { label: "Urgencia", low: "Sereno", high: "Inmediato" },
  warmth: { label: "Calidez", low: "Neutro", high: "Afectuoso" },
  detail: { label: "Detalle", low: "Conciso", high: "Exhaustivo" },
};

type TimonState = {
  knobs: Knobs;
  mode: Mode;
  input: string;
  messages: Message[];
  isStreaming: boolean;
  abort: (() => void) | null;

  setKnob: (name: KnobName, value: number) => void;
  applyKnobs: (knobs: Knobs) => void;
  resetKnobs: () => void;
  setMode: (mode: Mode) => void;
  setInput: (input: string) => void;
  clearChat: () => void;
  send: () => Promise<void>;
  stop: () => void;
};

const uid = () => Math.random().toString(36).slice(2, 10);

export const useTimon = create<TimonState>((set, get) => ({
  knobs: { ...DEFAULT_KNOBS },
  mode: "respuesta",
  input: "",
  messages: [],
  isStreaming: false,
  abort: null,

  setKnob: (name, value) => set((s) => ({ knobs: { ...s.knobs, [name]: value } })),
  applyKnobs: (knobs) => set({ knobs: { ...knobs } }),
  resetKnobs: () => set({ knobs: { ...DEFAULT_KNOBS } }),
  setMode: (mode) => set({ mode }),
  setInput: (input) => set({ input }),
  clearChat: () => {
    get().abort?.();
    set({ messages: [], isStreaming: false, abort: null });
  },

  send: async () => {
    const { input, knobs, mode, isStreaming } = get();
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: Message = { id: uid(), role: "user", content: text, knobs: { ...knobs } };
    const botMsg: Message = { id: uid(), role: "assistant", content: "", knobs: { ...knobs } };
    set((s) => ({
      messages: [...s.messages, userMsg, botMsg],
      input: "",
      isStreaming: true,
    }));

    const append = (token: string) =>
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === botMsg.id ? { ...m, content: m.content + token } : m,
        ),
      }));

    const { done, abort } = streamChat(text, knobs, mode, append);
    set({ abort });
    try {
      await done;
    } catch {
      append("\n\n⚓ Se perdió el rumbo (conexión interrumpida).");
    } finally {
      set({ isStreaming: false, abort: null });
    }
  },

  stop: () => {
    get().abort?.();
    set({ isStreaming: false, abort: null });
  },
}));
