// Unified Text-to-Speech helper.
// - Web: uses window.speechSynthesis (Google Web Speech API).
// - Android/iOS (Capacitor): uses @capacitor-community/text-to-speech
//   which delegates to the native OS TTS engine (Google TTS / Samsung TTS
//   / iOS AVSpeechSynthesizer). Android WebView does NOT ship the Web
//   Speech API, so the plugin is required for the app build.

import { Capacitor } from "@capacitor/core";

type SpeakOptions = {
  text: string;
  lang?: string;      // e.g. "hi-IN", "en-IN"
  rate?: number;      // web: 0.1-10 (default ~1). native: 0.1-2.
  pitch?: number;     // 0-2
  volume?: number;    // 0-1
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
};

let nativePluginPromise: Promise<any> | null = null;
function getNativePlugin() {
  if (!nativePluginPromise) {
    nativePluginPromise = import("@capacitor-community/text-to-speech")
      .then((m) => m.TextToSpeech)
      .catch(() => null);
  }
  return nativePluginPromise;
}

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

type AndroidDirectTtsBridge = {
  isReady?: () => boolean;
  isAvailable?: () => boolean;
  speak?: (text: string, lang: string, rate: number, pitch: number, volume: number) => string;
  stop?: () => void;
  openInstall?: () => void;
};

function getAndroidDirectTtsBridge(): AndroidDirectTtsBridge | null {
  if (typeof window === "undefined") return null;
  const bridge = (window as any).MbdNativeTts as AndroidDirectTtsBridge | undefined;
  if (!bridge || typeof bridge.speak !== "function") return null;
  return bridge;
}

function hasAndroidDirectTtsBridge(): boolean {
  const bridge = getAndroidDirectTtsBridge();
  if (!bridge) return false;
  try { return bridge.isAvailable?.() !== false; } catch { return true; }
}

function hasNativeTextToSpeechBridge(): boolean {
  try {
    const cap = (globalThis as any)?.Capacitor ?? Capacitor;
    const pluginHeaders = cap?.PluginHeaders;
    const hasPluginHeader = Array.isArray(pluginHeaders)
      && pluginHeaders.some((header: { name?: string }) => header?.name === "TextToSpeech");

    return Boolean(
      cap?.isNativePlatform?.()
      || cap?.getPlatform?.() === "android"
      || cap?.getPlatform?.() === "ios"
      || cap?.isPluginAvailable?.("TextToSpeech")
      || (hasPluginHeader && typeof cap?.nativePromise === "function")
    );
  } catch {
    return false;
  }
}

function nativeLanguageCandidates(lang: string): string[] {
  const requested = (lang || "hi-IN").trim();
  const base = requested.split("-")[0];
  return Array.from(new Set([
    requested,
    base,
    "hi-IN",
    "hi",
    "en-IN",
    "en-US",
  ].filter(Boolean)));
}

function isInitOrEngineError(error: unknown): boolean {
  const message = String((error as { message?: string })?.message ?? error).toLowerCase();
  return message.includes("not yet initialized") || message.includes("not available");
}

function isUnsupportedLanguageError(error: unknown): boolean {
  const message = String((error as { message?: string })?.message ?? error).toLowerCase();
  return message.includes("language") && message.includes("not supported");
}

export function isNativeTtsPlatform(): boolean {
  return hasAndroidDirectTtsBridge() || hasNativeTextToSpeechBridge();
}

export async function cancelSpeech(): Promise<void> {
  const directBridge = getAndroidDirectTtsBridge();
  if (directBridge) {
    try { directBridge.stop?.(); } catch {}
  }
  if (isNativeTtsPlatform()) {
    const tts = await getNativePlugin();
    try { await tts?.stop(); } catch {}
    return;
  }
  try { window.speechSynthesis?.cancel(); } catch {}
}

export async function speakUnified(opts: SpeakOptions): Promise<void> {
  const { text, lang = "hi-IN", rate = 1.0, pitch = 1.0, volume = 1.0,
          onStart, onEnd, onError } = opts;
  if (!text) return;

  // ANDROID WebView hard fallback.
  // Some remote-server Capacitor builds can load the web bundle correctly but
  // fail to expose Capacitor community plugin proxies to JS. This direct
  // JavaScriptInterface is injected by MainActivity and talks to Android's
  // TextToSpeech engine without relying on the Capacitor plugin bridge.
  const directBridge = getAndroidDirectTtsBridge();
  if (directBridge) {
    let started = false;
    const markStarted = () => {
      if (started) return;
      started = true;
      onStart?.();
    };

    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        if (directBridge.isReady?.() !== false) break;
      } catch {
        break;
      }
      await wait(200);
    }

    await new Promise<void>((resolve) => {
      let utteranceId = "";
      let finished = false;
      const cleanup = () => {
        window.removeEventListener("mbd-native-tts-start", handleStart as EventListener);
        window.removeEventListener("mbd-native-tts-end", handleEnd as EventListener);
        window.removeEventListener("mbd-native-tts-error", handleError as EventListener);
        window.clearTimeout(timeoutId);
      };
      const isThisUtterance = (event: Event) => {
        const id = (event as CustomEvent<{ utteranceId?: string }>).detail?.utteranceId;
        return !id || !utteranceId || id === utteranceId;
      };
      const finish = (ok: boolean) => {
        if (finished) return;
        finished = true;
        cleanup();
        if (ok) onEnd?.(); else onError?.();
        resolve();
      };
      const handleStart = (event: Event) => {
        if (!isThisUtterance(event)) return;
        markStarted();
      };
      const handleEnd = (event: Event) => {
        if (!isThisUtterance(event)) return;
        finish(true);
      };
      const handleError = (event: Event) => {
        if (!isThisUtterance(event)) return;
        console.warn("Bharat Mitra direct Android TTS failed", (event as CustomEvent).detail);
        finish(false);
      };
      const timeoutId = window.setTimeout(() => {
        // If Android does not return progress callbacks on a specific engine,
        // avoid leaving the UI stuck in speaking mode.
        finish(true);
      }, Math.min(90000, Math.max(10000, text.length * 90)));

      window.addEventListener("mbd-native-tts-start", handleStart as EventListener);
      window.addEventListener("mbd-native-tts-end", handleEnd as EventListener);
      window.addEventListener("mbd-native-tts-error", handleError as EventListener);

      try {
        directBridge.stop?.();
        utteranceId = directBridge.speak?.(
          text,
          lang,
          Math.min(2, Math.max(0.1, rate)),
          Math.min(2, Math.max(0.1, pitch)),
          Math.min(1, Math.max(0, volume)),
        ) ?? "";
        window.setTimeout(markStarted, 250);
      } catch (error) {
        console.warn("Bharat Mitra direct Android TTS bridge call failed", error);
        try { directBridge.openInstall?.(); } catch {}
        finish(false);
      }
    });
    return;
  }

  // CAPACITOR NATIVE (Android / iOS)
  if (isNativeTtsPlatform()) {
    const tts = await getNativePlugin();
    if (!tts) { onError?.(); return; }

    const nativePayload = {
      text,
      rate: Math.min(2, Math.max(0.1, rate)),
      pitch: Math.min(2, Math.max(0, pitch)),
      volume: Math.min(1, Math.max(0, volume)),
      category: "playback",
      queueStrategy: 0,
    };

    let started = false;
    const markStarted = () => {
      if (started) return;
      started = true;
      onStart?.();
    };

    for (const candidateLang of nativeLanguageCandidates(lang)) {
      try {
        const support = await tts.isLanguageSupported?.({ lang: candidateLang });
        if (support && support.supported === false) continue;
      } catch {
        // Some Android engines throw during early boot; the speak retry below
        // is the authoritative check, so keep going.
      }

      for (let attempt = 0; attempt < 5; attempt += 1) {
        if (attempt > 0) await wait(300);
        try { await tts.stop(); } catch {}
        try {
          markStarted();
          await tts.speak({ ...nativePayload, lang: candidateLang });
          onEnd?.();
          return;
        } catch (error) {
          console.warn("Bharat Mitra native TTS failed", {
            platform: (() => { try { return Capacitor.getPlatform(); } catch { return "unknown"; } })(),
            pluginAvailable: (() => { try { return Capacitor.isPluginAvailable("TextToSpeech"); } catch { return false; } })(),
            lang: candidateLang,
            attempt: attempt + 1,
            message: String((error as { message?: string })?.message ?? error),
          });
          if (isInitOrEngineError(error)) continue;
          if (isUnsupportedLanguageError(error)) break;
          onError?.();
          return;
        }
      }
    }

    try { await tts.openInstall?.(); } catch {}
    onError?.();
    return;
  }

  // WEB — Google Web Speech API
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onError?.();
    return;
  }
  const synth = window.speechSynthesis;
  const utter = new SpeechSynthesisUtterance(text);
  const target = lang.toLowerCase();
  const targetPrefix = target.split("-")[0];
  const isNatural = (v: SpeechSynthesisVoice) => {
    const n = v.name.toLowerCase();
    return n.includes("natural") || n.includes("neural") ||
           n.includes("wavenet") || n.includes("google") || n.includes("online");
  };
  const voices = synth.getVoices();
  const match = (v: SpeechSynthesisVoice, exact: boolean) =>
    exact ? v.lang.toLowerCase() === target
          : v.lang.toLowerCase().startsWith(targetPrefix);
  const preferred =
    voices.find((v) => match(v, true) && isNatural(v)) ??
    voices.find((v) => match(v, false) && isNatural(v)) ??
    voices.find((v) => match(v, true)) ??
    voices.find((v) => match(v, false)) ??
    voices.find((v) => v.lang.toLowerCase().startsWith("hi") && isNatural(v)) ??
    voices.find((v) => v.lang.toLowerCase().startsWith("hi")) ??
    null;
  if (preferred) { utter.voice = preferred; utter.lang = preferred.lang; }
  else { utter.lang = lang; }
  utter.rate = rate; utter.pitch = pitch; utter.volume = volume;
  utter.onstart = () => onStart?.();
  utter.onend = () => onEnd?.();
  utter.onerror = () => onError?.();
  try { synth.cancel(); } catch {}
  if (synth.getVoices().length === 0) {
    synth.onvoiceschanged = () => { synth.onvoiceschanged = null; synth.speak(utter); };
    window.setTimeout(() => synth.speak(utter), 350);
  } else {
    synth.speak(utter);
  }
}