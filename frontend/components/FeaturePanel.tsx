"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Radar, Layers } from "lucide-react";
import { listFeatures, type Feature } from "@/lib/api";

// Panel de features de GemmaScope: la "sonda" que muestra qué conceptos
// internos está dirigiendo el timón.
export function FeaturePanel() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listFeatures()
      .then(setFeatures)
      .catch(() => setFeatures([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="glass flex h-full flex-col p-5">
      <header className="mb-3 flex items-center gap-2">
        <div className="relative grid h-7 w-7 place-items-center rounded-lg bg-tide/10">
          <Radar size={15} className="text-tide" />
          <span className="absolute inset-0 origin-center animate-sweep rounded-lg bg-gradient-to-t from-transparent to-tide/30" />
        </div>
        <h2 className="panel-label">Sonda de features</h2>
      </header>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-9 animate-pulse rounded-lg bg-hull-light/40" />
            ))}
          </div>
        ) : features.length === 0 ? (
          <p className="py-6 text-center text-xs text-foam-faint">
            Sin features cargados. El motor real (GPU) los expone aparte.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {features.map((f, i) => (
              <motion.li
                key={f.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between rounded-lg border border-hull-border/40 bg-abyss-800/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-foam">{f.name}</p>
                  <p className="flex items-center gap-1 text-[10px] text-foam-faint">
                    <Layers size={9} /> capa {f.layer} · idx {f.index}
                  </p>
                </div>
                <span
                  className="ml-2 shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px]"
                  style={{
                    color: f.polarity >= 0 ? "#5eead4" : "#ff6b6b",
                    background: f.polarity >= 0 ? "rgba(45,212,191,0.1)" : "rgba(255,107,107,0.1)",
                  }}
                >
                  {f.polarity >= 0 ? "+" : ""}
                  {f.polarity}
                </span>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
