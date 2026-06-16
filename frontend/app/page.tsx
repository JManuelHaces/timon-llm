import { KnobConsole } from "@/components/KnobConsole";
import { ChatStream } from "@/components/ChatStream";
import { PresetManager } from "@/components/PresetManager";
import { FeaturePanel } from "@/components/FeaturePanel";

export default function Home() {
  return (
    <main style={{ display: "grid", gridTemplateColumns: "320px 1fr 280px", gap: 16, padding: 24 }}>
      <section>
        <h1 style={{ fontSize: 20 }}>Timón</h1>
        <KnobConsole />
        <PresetManager />
      </section>
      <section>
        <ChatStream />
      </section>
      <aside>
        <FeaturePanel />
      </aside>
    </main>
  );
}
