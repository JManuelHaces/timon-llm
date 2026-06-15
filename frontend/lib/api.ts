// Cliente del backend de Timón. La URL viene de NEXT_PUBLIC_API_URL.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Knobs = { formality: number; urgency: number; warmth: number; detail: number };
export type Mode = "respuesta" | "reescritura";

// POST /api/chat → stream SSE. Llama onToken por cada token recibido.
export async function streamChat(
  prompt: string,
  knobs: Knobs,
  mode: Mode,
  onToken: (t: string) => void,
): Promise<void> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, knobs, mode }),
  });
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value).split("\n")) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        onToken(data);
      }
    }
  }
}

export type Preset = { id: number; name: string; knobs: Knobs };

export async function listPresets(): Promise<Preset[]> {
  return (await fetch(`${API_URL}/api/presets`)).json();
}

export type Feature = { id: number; name: string; layer: number; index: number; polarity: number };

export async function listFeatures(): Promise<Feature[]> {
  return (await fetch(`${API_URL}/api/features`)).json();
}
