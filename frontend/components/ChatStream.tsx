"use client";
import { useState } from "react";
import { streamChat, type Knobs } from "@/lib/api";

// Chat con streaming. TODO(rol B): recibir las perillas reales de KnobConsole.
export function ChatStream() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const knobs: Knobs = { formality: 50, urgency: 50, warmth: 50, detail: 50 };

  async function send() {
    setOutput("");
    await streamChat(prompt, knobs, "respuesta", (t) => setOutput((o) => o + t));
  }

  return (
    <div>
      <h2 style={{ fontSize: 14, opacity: 0.7 }}>Chat</h2>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Escribe un mensaje…"
        style={{ width: "100%", minHeight: 80 }}
      />
      <button onClick={send} style={{ marginTop: 8 }}>Enviar</button>
      <pre style={{ whiteSpace: "pre-wrap", marginTop: 16 }}>{output}</pre>
    </div>
  );
}
