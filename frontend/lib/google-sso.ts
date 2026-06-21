// Carga e inicialización de Google Identity Services (GIS).
// El client ID viene de NEXT_PUBLIC_GOOGLE_CLIENT_ID.
// Exporta initGoogle() para cargar el script y renderGoogleButton() para montar el botón.

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

type CredentialResponse = {
  credential: string;
  select_by: string;
  clientId: string;
};

let gsiLoaded = false;
let loadPromise: Promise<void> | null = null;

function loadGsiScript(): Promise<void> {
  if (gsiLoaded) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      gsiLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("No se pudo cargar el script de Google Identity"));
    document.head.appendChild(script);
  });
  return loadPromise;
}

export async function initGoogle(onCredential: (credential: string) => void): Promise<void> {
  if (!CLIENT_ID) return;
  await loadGsiScript();

  const google = (window as any).google;
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (response: CredentialResponse) => {
      onCredential(response.credential);
    },
    auto_select: false,
    cancel_on_tap_outside: true,
  });
}

export function promptGoogleOneTap(onDismissed?: () => void): void {
  const google = (window as any).google;
  if (!google?.accounts?.id) return;
  google.accounts.id.prompt((notification: any) => {
    if (
      notification.isNotDisplayed() ||
      notification.isSkippedMoment() ||
      notification.isDismissedMoment()
    ) {
      onDismissed?.();
    }
  });
}

export function hasGoogleClientId(): boolean {
  return CLIENT_ID.length > 0;
}
