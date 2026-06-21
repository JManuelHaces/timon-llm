"use client";
import { RotateCcw } from "lucide-react";
import { Knob } from "./Knob";
import { useTimon, KNOB_META, type KnobName } from "@/lib/store";

const ACCENT: Record<KnobName, string> = {
  formality: "#2dd4bf",
  urgency: "#ff6b6b",
  warmth: "#e0a85a",
  detail: "#a78bfa",
};

const ORDER: KnobName[] = ["formality", "urgency", "warmth", "detail"];

export function KnobConsole() {
  const knobs = useTimon((s) => s.knobs);
  const setKnob = useTimon((s) => s.setKnob);
  const reset = useTimon((s) => s.resetKnobs);

  return (
    <section className="glass p-5">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="panel-label">Consola de voz</h2>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 rounded-lg border border-hull-border/70 px-2.5 py-1 text-[11px] text-foam-dim transition hover:border-brass/50 hover:text-brass"
        >
          <RotateCcw size={12} /> Centrar
        </button>
      </header>

      <div className="grid grid-cols-2 gap-x-2 gap-y-6">
        {ORDER.map((name) => (
          <div key={name} className="flex justify-center">
            <Knob
              value={knobs[name]}
              onChange={(v) => setKnob(name, v)}
              label={KNOB_META[name].label}
              low={KNOB_META[name].low}
              high={KNOB_META[name].high}
              accent={ACCENT[name]}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
