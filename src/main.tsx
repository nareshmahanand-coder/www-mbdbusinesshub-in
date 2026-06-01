import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { restoreSessionFromNativeStorage } from "./lib/capacitorSessionBridge";

function mount() {
  createRoot(document.getElementById("root")!).render(<App />);
}

restoreSessionFromNativeStorage()
  .catch(() => {})
  .finally(mount);
