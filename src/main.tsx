import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { restoreSessionFromNativeStorage } from "./lib/capacitorSessionBridge";
import { initPushNotifications } from "./lib/pushNotifications";

restoreSessionFromNativeStorage().finally(() => {
  createRoot(document.getElementById("root")!).render(<App />);
  void initPushNotifications();
});
