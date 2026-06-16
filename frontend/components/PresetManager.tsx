"use client";
import { useEffect, useState } from "react";
import { listPresets, type Preset } from "@/lib/api";

// Presets de voz (slide 8). TODO(rol B): aplicar/crear/borrar presets.
export function PresetManager() {
  const [presets, setPresets] = useState<Preset[]>([]);
  useEffect(() => {
    listPresets().then(setPresets).catch(() => setPresets([]));
  }, []);
  return (
    <div style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 14, opacity: 0.7 }}>Presets</h2>
      {presets.length === 0 ? (
        <p style={{ opacity: 0.5 }}>Sin presets todavía.</p>
      ) : (
        <ul>{presets.map((p) => <li key={p.id}>{p.name}</li>)}</ul>
      )}
    </div>
  );
}
