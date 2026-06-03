import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { restoreSessionFromNativeStorage } from "./lib/capacitorSessionBridge";
import { registerNativeOAuthDeepLink } from "./lib/nativeGoogleAuth";
import { initNativePush } from "./lib/nativePush";

function mount() {
  createRoot(document.getElementById("root")!).render(<App />);
}

restoreSessionFromNativeStorage()
  .catch(() => {})
  .finally(() => {
    try {
      registerNativeOAuthDeepLink();
    } catch {
      /* no-op */
    }
    // Fire-and-forget; safe wrapper guarantees no crash if FCM is not
    // available or permissions are denied.
    void initNativePush();
    mount();
  });
