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

export function isNativeTtsPlatform(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export async function cancelSpeech(): Promise<void> {
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

  // NATIVE (Android / iOS)
  if (isNativeTtsPlatform()) {
    const tts = await getNativePlugin();
    if (!tts) { onError?.(); return; }
    try { await tts.stop(); } catch {}
    try {
      onStart?.();
      await tts.speak({
        text,
        lang,
        rate: Math.min(2, Math.max(0.1, rate)),
        pitch: Math.min(2, Math.max(0, pitch)),
        volume: Math.min(1, Math.max(0, volume)),
        category: "playback",
      });
      onEnd?.();
    } catch {
      onError?.();
    }
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