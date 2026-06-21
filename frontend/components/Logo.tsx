"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

// Timón: rueda de mando náutica. Gira lento de forma continua; los radios
// laten sutilmente. Es la marca del producto.
export function Logo({ size = 36, spinning = true }: { size?: number; spinning?: boolean }) {
  const spokes = Array.from({ length: 8 }, (_, i) => (i * 360) / 8);
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn("drop-shadow-[0_0_12px_rgba(224,168,90,0.35)]")}
      animate={spinning ? { rotate: 360 } : undefined}
      transition={spinning ? { duration: 28, ease: "linear", repeat: Infinity } : undefined}
    >
      <defs>
        <linearGradient id="brass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f2c885" />
          <stop offset="55%" stopColor="#e0a85a" />
          <stop offset="100%" stopColor="#b07e34" />
        </linearGradient>
      </defs>
      {/* aro exterior */}
      <circle cx="50" cy="50" r="34" fill="none" stroke="url(#brass)" strokeWidth="5" />
      <circle cx="50" cy="50" r="20" fill="none" stroke="url(#brass)" strokeWidth="3" opacity="0.8" />
      {/* cubo central */}
      <circle cx="50" cy="50" r="6" fill="url(#brass)" />
      {/* radios y empuñaduras */}
      {spokes.map((a, i) => (
        <g key={i} transform={`rotate(${a} 50 50)`}>
          <rect x="48.5" y="8" width="3" height="40" rx="1.5" fill="url(#brass)" />
          <circle cx="50" cy="9" r="4.5" fill="url(#brass)" />
        </g>
      ))}
    </motion.svg>
  );
}
