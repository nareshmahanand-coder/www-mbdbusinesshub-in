import { useEffect, useRef } from "react";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { toast } from "@/hooks/use-toast";

/**
 * If the URL contains ?install=1 (shared link from "Share App"),
 * automatically show the native PWA install prompt as soon as the
 * browser fires beforeinstallprompt. Falls back to a toast with
 * manual instructions when the browser doesn't expose the prompt
 * (e.g. iOS Safari, already-installed, or PWA opened standalone).
 */
const InstallPromptAutoTrigger = () => {
  const { canInstall, promptInstall } = usePwaInstall();
  const triggeredRef = useRef(false);
  const fallbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("install") !== "1") return;

    // Skip if already running as installed PWA
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS
      (window.navigator as any).standalone === true;
    if (isStandalone) return;

    // Fallback: if prompt never fires within 2.5s (iOS / unsupported),
    // show a toast with manual install hint.
    fallbackTimerRef.current = window.setTimeout(() => {
      if (triggeredRef.current) return;
      const ua = navigator.userAgent || "";
      const isIOS = /iPad|iPhone|iPod/.test(ua);
      toast({
        title: "Install Mera Bharat Dukaan",
        description: isIOS
          ? "Safari में Share बटन दबाएँ और 'Add to Home Screen' चुनें।"
          : "Browser menu खोलें और 'Install app' / 'Add to Home screen' चुनें।",
        duration: 8000,
      });
    }, 2500);

    return () => {
      if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (triggeredRef.current) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("install") !== "1") return;
    if (!canInstall) return;

    triggeredRef.current = true;
    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    // Small delay so the UI is painted before native dialog appears
    const t = window.setTimeout(() => {
      promptInstall().then((outcome) => {
        if (outcome === "accepted") {
          toast({ title: "App installing…", description: "Home screen पर ऐप जुड़ रहा है।" });
        }
        // Clean the query param so refresh/back doesn't re-prompt
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete("install");
          window.history.replaceState({}, "", url.toString());
        } catch {
          /* noop */
        }
      });
    }, 600);
    return () => window.clearTimeout(t);
  }, [canInstall, promptInstall]);

  return null;
};

export default InstallPromptAutoTrigger;