import { AuthGuard } from "@/components/AuthGuard";
import { Header } from "@/components/Header";
import { KnobConsole } from "@/components/KnobConsole";
import { ChatStream } from "@/components/ChatStream";
import { PresetManager } from "@/components/PresetManager";
import { FeaturePanel } from "@/components/FeaturePanel";

// Vista principal de Timón (protegida). Solo accesible con sesión activa.
export default function TimonPage() {
  return (
    <AuthGuard>
      <div className="mx-auto max-w-[1500px]">
        <Header />
        <main className="grid grid-cols-1 gap-4 px-6 pb-6 lg:grid-cols-[300px_1fr_280px]">
          {/* Babor: consola de perillas + rumbos */}
          <div className="flex flex-col gap-4">
            <KnobConsole />
            <PresetManager />
          </div>

          {/* Centro: timón en acción */}
          <ChatStream />

          {/* Estribor: sonda de features */}
          <div className="hidden lg:block">
            <div className="h-[calc(100vh-7.5rem)]">
              <FeaturePanel />
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
