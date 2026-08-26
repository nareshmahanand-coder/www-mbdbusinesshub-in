import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import { restoreSessionFromNativeStorage } from "./lib/capacitorSessionBridge";
import { requestMediaPermissionsOnce } from "./lib/requestMediaPermissions";

async function mount() {
  const { default: App } = await import("./App.tsx");
  createRoot(document.getElementById("root")!).render(
    <HelmetProvider>
      <App />
    </HelmetProvider>,
  );
}


restoreSessionFromNativeStorage()
  .catch(() => {})
  .finally(() => {
    // Fire-and-forget; safe wrapper guarantees no crash if FCM is not
    // available or permissions are denied.
    void import("./lib/nativePush").then(({ initNativePush }) => initNativePush()).catch(() => {});
    // Prompt Camera + Microphone runtime permissions on app start
    // (like Location & Notifications). Delayed slightly so UI mounts first.
    setTimeout(() => { void requestMediaPermissionsOnce(); }, 1500);
    void mount();
  });
