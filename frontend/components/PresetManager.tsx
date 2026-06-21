"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark, Plus, Anchor, Pencil, Trash2, Check, X,
  Save, RefreshCw, AlertTriangle, Loader2,
} from "lucide-react";
import {
  listPresets, createPreset, updatePreset, deletePreset,
  type Preset, type Knobs,
} from "@/lib/api";
import { useTimon, DEFAULT_KNOBS } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";

const FREEMIUM_LIMIT = 3;

// ── helpers ─────────────────────────────────────────────────────────────────

function knobsEqual(a: Knobs, b: Knobs) {
  return a.formality === b.formality && a.urgency === b.urgency &&
    a.warmth === b.warmth && a.detail === b.detail;
}

function KnobBars({ knobs }: { knobs: Knobs }) {
  const keys: (keyof Knobs)[] = ["formality", "urgency", "warmth", "detail"];
  return (
    <div className="flex items-end gap-[3px]">
      {keys.map((k) => (
        <span
          key={k}
          className="w-[3px] rounded-full bg-tide/60"
          style={{ height: 4 + (knobs[k] / 100) * 14 }}
        />
      ))}
    </div>
  );
}

// ── Diálogo de advertencia ───────────────────────────────────────────────────

function WarnDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 6 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="rounded-xl border border-brass/30 bg-abyss-800/90 p-4 backdrop-blur"
    >
      <div className="mb-3 flex items-start gap-2.5">
        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-brass" />
        <div>
          <p className="text-[12px] font-semibold text-foam">¿Cambiar de rumbo?</p>
          <p className="mt-0.5 text-[11px] leading-snug text-foam-dim">
            Tienes perillas sin guardar. Se perderán los cambios actuales.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-hull-border/60 py-1.5 text-[11px] text-foam-dim transition hover:text-foam"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 rounded-lg bg-brass-sheen py-1.5 text-[11px] font-semibold text-abyss-900 transition hover:brightness-110"
        >
          Cambiar igual
        </button>
      </div>
    </motion.div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────

export function PresetManager() {
  const knobs = useTimon((s) => s.knobs);
  const applyKnobs = useTimon((s) => s.applyKnobs);
  const userRole = useAuth((s) => s.user?.role ?? "freemium");

  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);

  // Rumbo activo (el último que se cargó en la consola)
  const [activeId, setActiveId] = useState<number | null>(null);
  // Copia de knobs tal como estaban al cargar/guardar el rumbo activo
  const [baseKnobs, setBaseKnobs] = useState<Knobs>(DEFAULT_KNOBS);

  // Creación de nuevo rumbo
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  // Edición inline de nombre
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  // Eliminación
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Advertencia de cambios sin guardar
  const [warnPreset, setWarnPreset] = useState<Preset | null>(null);

  const newNameRef = useRef<HTMLInputElement>(null);
  const editNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listPresets()
      .then(setPresets)
      .catch(() => setPresets([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (creating) setTimeout(() => newNameRef.current?.focus(), 50);
  }, [creating]);

  useEffect(() => {
    if (editingId) setTimeout(() => editNameRef.current?.focus(), 50);
  }, [editingId]);

  const isDirty = !knobsEqual(knobs, baseKnobs);

  // ── Seleccionar rumbo ────────────────────────────────────────────────────

  const loadPreset = (p: Preset) => {
    applyKnobs(p.knobs);
    setActiveId(p.id);
    setBaseKnobs({ ...p.knobs });
    setWarnPreset(null);
  };

  const handleSelect = (p: Preset) => {
    if (p.id === activeId) return;
    if (isDirty) {
      setWarnPreset(p);
    } else {
      loadPreset(p);
    }
  };

  // ── Guardar nuevo rumbo ──────────────────────────────────────────────────

  const handleCreate = async () => {
    const name = newName.trim() || `Rumbo ${presets.length + 1}`;
    setSaving(true);
    try {
      const preset = await createPreset(name, knobs);
      setPresets((prev) => [preset, ...prev]);
      setActiveId(preset.id);
      setBaseKnobs({ ...knobs });
      setCreating(false);
      setNewName("");
    } catch {
      // silencioso
    } finally {
      setSaving(false);
    }
  };

  // ── Actualizar knobs del rumbo activo ────────────────────────────────────

  const handleUpdateKnobs = async (p: Preset) => {
    try {
      const updated = await updatePreset(p.id, { knobs });
      setPresets((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
      setBaseKnobs({ ...knobs });
    } catch {
      // silencioso
    }
  };

  // ── Renombrar ────────────────────────────────────────────────────────────

  const handleRename = async (p: Preset) => {
    const name = editName.trim();
    if (!name || name === p.name) { setEditingId(null); return; }
    try {
      const updated = await updatePreset(p.id, { name });
      setPresets((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
    } catch {
      // silencioso
    } finally {
      setEditingId(null);
    }
  };

  // ── Eliminar ─────────────────────────────────────────────────────────────

  const handleDelete = async (p: Preset) => {
    setDeletingId(p.id);
    try {
      await deletePreset(p.id);
      setPresets((prev) => prev.filter((x) => x.id !== p.id));
      if (activeId === p.id) {
        setActiveId(null);
        setBaseKnobs(DEFAULT_KNOBS);
      }
    } catch {
      // silencioso
    } finally {
      setDeletingId(null);
    }
  };

  const active = presets.find((p) => p.id === activeId) ?? null;
  const isFreemium = userRole === "freemium";
  const atLimit = isFreemium && presets.length >= FREEMIUM_LIMIT;

  return (
    <section className="glass p-5">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="panel-label flex items-center gap-1.5">
          <Bookmark size={13} /> Rumbos guardados
          {isFreemium && (
            <span className="ml-1 text-[10px] text-foam-faint">
              {presets.length}/{FREEMIUM_LIMIT}
            </span>
          )}
        </h2>
        <button
          onClick={() => { if (!atLimit) { setCreating((c) => !c); setNewName(""); } }}
          disabled={atLimit && !creating}
          title={atLimit ? `Límite Freemium: ${FREEMIUM_LIMIT} rumbos` : undefined}
          className={cn(
            "flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition",
            creating
              ? "border-tide/50 text-tide"
              : atLimit
                ? "cursor-not-allowed border-hull-border/40 text-foam-faint/50"
                : "border-hull-border/70 text-foam-dim hover:border-tide/50 hover:text-tide",
          )}
        >
          {creating ? <X size={12} /> : <Plus size={12} />}
          {creating ? "Cancelar" : "Nuevo"}
        </button>
      </header>

      {/* Aviso de límite freemium */}
      <AnimatePresence>
        {atLimit && !creating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2 rounded-lg border border-brass/25 bg-brass/5 px-3 py-2">
              <p className="text-[11px] text-brass/80">
                Límite Freemium alcanzado ({FREEMIUM_LIMIT} rumbos)
              </p>
              <a
                href="/timon/perfil"
                className="text-[11px] font-semibold text-brass underline-offset-2 hover:underline"
              >
                Mejorar plan
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input para crear nuevo rumbo */}
      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <div className="flex gap-2">
              <input
                ref={newNameRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setCreating(false); }}
                placeholder={`Rumbo ${presets.length + 1}`}
                className="flex-1 rounded-lg border border-hull-border/70 bg-abyss-800/60 px-3 py-1.5 text-[12px] text-foam placeholder:text-foam-faint focus:border-tide/40 focus:outline-none"
              />
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex items-center gap-1 rounded-lg bg-brass-sheen px-2.5 py-1.5 text-[11px] font-semibold text-abyss-900 transition hover:brightness-110 disabled:opacity-60"
              >
                {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                Guardar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advertencia de cambios sin guardar */}
      <AnimatePresence>
        {warnPreset && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <WarnDialog
              onConfirm={() => loadPreset(warnPreset)}
              onCancel={() => setWarnPreset(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón "Actualizar rumbo" cuando hay cambios sobre el activo */}
      <AnimatePresence>
        {active && isDirty && !warnPreset && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <button
              onClick={() => handleUpdateKnobs(active)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-tide/30 bg-tide/8 py-1.5 text-[11px] font-medium text-tide transition hover:bg-tide/15"
            >
              <RefreshCw size={11} /> Actualizar "{active.name}" con perillas actuales
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-5">
          <Loader2 size={16} className="animate-spin text-foam-faint" />
        </div>
      ) : presets.length === 0 ? (
        <div className="flex flex-col items-center gap-1 py-4 text-center text-foam-faint">
          <Anchor size={20} className="opacity-50" />
          <p className="text-xs">Sin rumbos todavía. Guarda el actual.</p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          <AnimatePresence initial={false}>
            {presets.map((p) => {
              const isActive = p.id === activeId;
              const isEditing = editingId === p.id;
              const isDeleting = deletingId === p.id;

              return (
                <motion.li
                  key={p.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8, height: 0 }}
                >
                  {isEditing ? (
                    <div className="flex gap-1.5">
                      <input
                        ref={editNameRef}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(p);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="flex-1 rounded-lg border border-tide/40 bg-abyss-800/60 px-2.5 py-1.5 text-[12px] text-foam focus:outline-none"
                      />
                      <button onClick={() => handleRename(p)} className="grid h-7 w-7 place-items-center rounded-lg bg-tide/20 text-tide transition hover:bg-tide/30">
                        <Check size={12} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="grid h-7 w-7 place-items-center rounded-lg border border-hull-border/60 text-foam-faint transition hover:text-foam">
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "group flex w-full items-center gap-2 rounded-xl border px-3 py-2 transition",
                        isActive
                          ? "border-tide/40 bg-tide/8 shadow-[0_0_0_1px_rgba(45,212,191,0.15)]"
                          : "border-hull-border/50 bg-abyss-800/40 hover:border-tide/30 hover:bg-hull-light/60",
                      )}
                    >
                      {/* Nombre — click para cargar */}
                      <button
                        onClick={() => handleSelect(p)}
                        className="flex flex-1 items-center gap-2 text-left"
                      >
                        <span className={cn("text-[12px] font-medium", isActive ? "text-tide" : "text-foam group-hover:text-foam")}>
                          {p.name}
                        </span>
                        <KnobBars knobs={p.knobs} />
                      </button>

                      {/* Acciones */}
                      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={() => { setEditingId(p.id); setEditName(p.name); }}
                          className="grid h-6 w-6 place-items-center rounded-md text-foam-faint transition hover:bg-hull-border/40 hover:text-foam"
                          title="Renombrar"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={isDeleting}
                          className="grid h-6 w-6 place-items-center rounded-md text-foam-faint transition hover:bg-coral/15 hover:text-coral disabled:opacity-40"
                          title="Eliminar"
                        >
                          {isDeleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
