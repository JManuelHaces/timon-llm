"use client";
import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

// Perilla rotativa de 270°. Se arrastra vertical (u horizontal) para girar,
// o con la rueda del ratón. El arco cónico marca el valor; la muesca de latón gira.
type Props = {
  value: number;
  onChange: (v: number) => void;
  label: string;
  low: string;
  high: string;
  accent: string;
  size?: number;
};

const SWEEP = 270;
const MIN_ANGLE = -135;

export function Knob({ value, onChange, label, low, high, accent, size = 96 }: Props) {
  const [dragging, setDragging] = useState(false);
  const startRef = useRef<{ y: number; x: number; v: number } | null>(null);

  const angle = MIN_ANGLE + (value / 100) * SWEEP;

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.target as Element).setPointerCapture(e.pointerId);
      startRef.current = { y: e.clientY, x: e.clientX, v: value };
      setDragging(true);
    },
    [value],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const s = startRef.current;
      if (!s) return;
      // arrastrar arriba o derecha sube; sensibilidad ~0.4/px
      const delta = (s.y - e.clientY) + (e.clientX - s.x);
      const next = Math.round(Math.min(100, Math.max(0, s.v + delta * 0.4)));
      onChange(next);
    },
    [onChange],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    startRef.current = null;
    setDragging(false);
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      const next = Math.min(100, Math.max(0, value + (e.deltaY < 0 ? 2 : -2)));
      onChange(next);
    },
    [value, onChange],
  );

  return (
    <div className="flex select-none flex-col items-center gap-2.5">
      <motion.div
        role="slider"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp" || e.key === "ArrowRight") onChange(Math.min(100, value + 1));
          if (e.key === "ArrowDown" || e.key === "ArrowLeft") onChange(Math.max(0, value - 1));
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
        animate={{ scale: dragging ? 1.06 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className={cn(
          "relative grid place-items-center rounded-full outline-none cursor-grab touch-none",
          dragging && "cursor-grabbing",
        )}
        style={{ width: size, height: size }}
      >
        {/* arco de valor (conic) */}
        <div
          className="absolute inset-0 rounded-full transition-[background] duration-75"
          style={{
            background: `conic-gradient(from 225deg, ${accent} ${(value / 100) * SWEEP}deg, rgba(255,255,255,0.06) ${(value / 100) * SWEEP}deg 270deg, transparent 270deg)`,
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 7px))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 7px))",
            filter: dragging ? `drop-shadow(0 0 10px ${accent})` : `drop-shadow(0 0 5px ${accent}66)`,
          }}
        />
        {/* cuerpo de la perilla */}
        <div
          className="absolute rounded-full bg-gradient-to-br from-hull-light to-abyss-900 shadow-[inset_0_2px_6px_rgba(255,255,255,0.06),inset_0_-8px_14px_rgba(0,0,0,0.6)]"
          style={{ inset: 14 }}
        />
        {/* muesca indicadora */}
        <div className="absolute" style={{ inset: 14, transform: `rotate(${angle}deg)` }}>
          <div
            className="absolute left-1/2 top-[6px] h-3.5 w-1 -translate-x-1/2 rounded-full"
            style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
          />
        </div>
        {/* valor */}
        <span className="relative font-mono text-sm font-semibold tabular-nums text-foam">
          {value}
        </span>
      </motion.div>

      <div className="text-center">
        <div className="panel-label text-foam">{label}</div>
        <div className="mt-0.5 flex w-[104px] justify-between text-[9px] uppercase tracking-wide text-foam-faint">
          <span>{low}</span>
          <span>{high}</span>
        </div>
      </div>
    </div>
  );
}
