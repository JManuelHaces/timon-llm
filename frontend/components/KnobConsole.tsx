"use client";
import { useState } from "react";
import type { Knobs } from "@/lib/api";

const NAMES: (keyof Knobs)[] = ["formality", "urgency", "warmth", "detail"];
const LABELS: Record<keyof Knobs, string> = {
  formality: "Formalidad",
  urgency: "Urgencia",
  warmth: "Calidez",
  detail: "Detalle",
};

// Consola de perillas (slide 4). TODO(rol B): elevar el estado y conectarlo al chat.
export function KnobConsole() {
  const [knobs, setKnobs] = useState<Knobs>({ formality: 50, urgency: 50, warmth: 50, detail: 50 });
  return (
    <div>
      <h2 style={{ fontSize: 14, opacity: 0.7 }}>Consola de voz</h2>
      {NAMES.map((name) => (
        <label key={name} style={{ display: "block", marginBottom: 12 }}>
          {LABELS[name]}: {knobs[name]}
          <input
            type="range"
            min={0}
            max={100}
            value={knobs[name]}
            onChange={(e) => setKnobs({ ...knobs, [name]: Number(e.target.value) })}
            style={{ width: "100%" }}
          />
        </label>
      ))}
    </div>
  );
}
