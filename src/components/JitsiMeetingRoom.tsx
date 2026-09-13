import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, Video } from "lucide-react";

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => {
      addListener: (event: string, handler: (...args: unknown[]) => void) => void;
      dispose: () => void;
    };
  }
}

interface JitsiMeetingRoomProps {
  roomName: string;
  displayName: string;
  email?: string;
  subject: string;
  language: "en" | "hi";
  onLeave?: () => void;
}

const JITSI_SCRIPT_ID = "jitsi-external-api";

const loadJitsi = () =>
  new Promise<void>((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) {
      resolve();
      return;
    }
    const existing = document.getElementById(JITSI_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Jitsi failed to load")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = JITSI_SCRIPT_ID;
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Jitsi failed to load"));
    document.head.appendChild(script);
  });

const JitsiMeetingRoom = ({ roomName, displayName, email, subject, language, onLeave }: JitsiMeetingRoomProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<InstanceType<NonNullable<typeof window.JitsiMeetExternalAPI>> | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    void loadJitsi()
      .then(() => {
        if (!active || !containerRef.current || !window.JitsiMeetExternalAPI) return;
        const api = new window.JitsiMeetExternalAPI("meet.jit.si", {
          roomName,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          userInfo: { displayName, email: email ?? "" },
          configOverwrite: {
            prejoinPageEnabled: false,
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableDeepLinking: true,
            enableWelcomePage: false,
            defaultLanguage: language,
            subject,
          },
          interfaceConfigOverwrite: {
            MOBILE_APP_PROMO: false,
            SHOW_JITSI_WATERMARK: false,
            TILE_VIEW_MAX_COLUMNS: 4,
            TOOLBAR_BUTTONS: [
              "microphone",
              "camera",
              "desktop",
              "chat",
              "participants-pane",
              "tileview",
              "select-background",
              "settings",
              "videoquality",
              "fullscreen",
              "raisehand",
              "hangup",
              "filmstrip",
              "feedback",
              "stats",
              "shortcuts",
              "mute-everyone",
              "mute-video-everyone",
            ],
          },
        });
        apiRef.current = api;
        api.addListener("videoConferenceJoined", () => setState("ready"));
        api.addListener("readyToClose", () => onLeave?.());
        setState("ready");
      })
      .catch(() => active && setState("error"));

    return () => {
      active = false;
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, [displayName, email, language, onLeave, roomName, subject]);

  return (
    <div className="relative h-[calc(100dvh-34px)] min-h-[520px] w-full overflow-hidden bg-foreground">
      {state === "loading" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background text-foreground">
          <Loader2 className="h-9 w-9 animate-spin text-primary" />
          <p className="text-sm font-semibold">{language === "hi" ? "मीटिंग रूम खुल रहा है…" : "Opening meeting room…"}</p>
        </div>
      )}
      {state === "error" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background px-5 text-center text-foreground">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <h2 className="text-xl font-bold">{language === "hi" ? "मीटिंग नहीं खुल सकी" : "Meeting could not open"}</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {language === "hi" ? "इंटरनेट कनेक्शन जाँचें और पेज दोबारा खोलें।" : "Check your internet connection and reload this page."}
          </p>
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" aria-label={`${subject} video meeting`} />
      {state === "ready" && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-2 rounded-md bg-background/90 px-2 py-1 text-xs font-semibold text-foreground shadow-md">
          <Video className="h-3.5 w-3.5 text-destructive" /> LIVE
        </div>
      )}
    </div>
  );
};

export default JitsiMeetingRoom;