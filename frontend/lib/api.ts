// Cliente del backend de Timón.
// JSON → axios. Streaming SSE → fetch (axios no expone el ReadableStream en el navegador).
import axios from "axios";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const http = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

export type Knobs = { formality: number; urgency: number; warmth: number; detail: number };
export type Mode = "respuesta" | "reescritura";

// POST /api/chat → stream SSE. Llama onToken por cada token; devuelve un abort().
export function streamChat(
  prompt: string,
  knobs: Knobs,
  mode: Mode,
  onToken: (t: string) => void,
): { done: Promise<void>; abort: () => void } {
  const controller = new AbortController();
  const done = (async () => {
    const res = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, knobs, mode }),
      signal: controller.signal,
    });
    if (!res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") return;
          onToken(data);
        }
      }
    }
  })();
  return { done, abort: () => controller.abort() };
}

export type Preset = { id: number; name: string; knobs: Knobs; user_id?: number };
export type Feature = { id: number; name: string; layer: number; index: number; polarity: number };

export async function listPresets(): Promise<Preset[]> {
  const { data } = await http.get<Preset[]>("/api/presets");
  return data;
}

export async function createPreset(name: string, knobs: Knobs): Promise<Preset> {
  const { data } = await http.post<Preset>("/api/presets", { name, knobs });
  return data;
}

export async function updatePreset(id: number, patch: { name?: string; knobs?: Knobs }): Promise<Preset> {
  const { data } = await http.put<Preset>(`/api/presets/${id}`, patch);
  return data;
}

export async function deletePreset(id: number): Promise<void> {
  await http.delete(`/api/presets/${id}`);
}

export async function listFeatures(): Promise<Feature[]> {
  const { data } = await http.get<Feature[]>("/api/features");
  return data;
}
