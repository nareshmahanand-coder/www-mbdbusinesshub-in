import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { restoreSessionFromNativeStorage } from "./lib/capacitorSessionBridge";
import { initPushNotifications } from "./lib/pushNotifications";

function mount() {
  createRoot(document.getElementById("root")!).render(<App />);
  // Never let native plugin init crash the app
  try { void initPushNotifications().catch(() => {}); } catch {}
}

restoreSessionFromNativeStorage()
  .catch(() => {})
  .finally(mount);
