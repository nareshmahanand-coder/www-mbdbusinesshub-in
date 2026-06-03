import { createRoot } from "react-dom/client";
import "./index.css";
import { restoreSessionFromNativeStorage } from "./lib/capacitorSessionBridge";

async function mount() {
  const { default: App } = await import("./App.tsx");
  createRoot(document.getElementById("root")!).render(<App />);
}

restoreSessionFromNativeStorage()
  .catch(() => {})
  .finally(() => {
    // Fire-and-forget; safe wrapper guarantees no crash if FCM is not
    // available or permissions are denied.
    void import("./lib/nativePush").then(({ initNativePush }) => initNativePush()).catch(() => {});
    void mount();
  });
