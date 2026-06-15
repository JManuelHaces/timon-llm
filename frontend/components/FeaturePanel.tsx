"use client";
import { useEffect, useState } from "react";
import { listFeatures, type Feature } from "@/lib/api";

// Panel de features de GemmaScope (slide 10). TODO(rol B/C): mostrar features curados.
export function FeaturePanel() {
  const [features, setFeatures] = useState<Feature[]>([]);
  useEffect(() => {
    listFeatures().then(setFeatures).catch(() => setFeatures([]));
  }, []);
  return (
    <div>
      <h2 style={{ fontSize: 14, opacity: 0.7 }}>Features</h2>
      {features.length === 0 ? (
        <p style={{ opacity: 0.5 }}>Sin features cargados.</p>
      ) : (
        <ul>{features.map((f) => <li key={f.id}>{f.name} (L{f.layer})</li>)}</ul>
      )}
    </div>
  );
}
