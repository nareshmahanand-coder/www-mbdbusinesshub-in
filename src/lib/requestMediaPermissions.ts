// Runtime permission prompt for Camera + Microphone.
// Works in Android WebView because the manifest already declares
// CAMERA and RECORD_AUDIO; Capacitor's WebChromeClient forwards the
// getUserMedia() request to the Android runtime prompt.
//
// We open the tracks briefly, then stop them immediately — the goal is
// the OS prompt, not an active stream.

let requested = false;

export async function requestMediaPermissionsOnce(): Promise<void> {
  if (requested) return;
  requested = true;

  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return;
  }

  const openAndStop = async (constraints: MediaStreamConstraints) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      // User denied or hardware not available — ignore, app still works.
    }
  };

  // Request sequentially so both native prompts appear on Android.
  await openAndStop({ audio: true });
  await openAndStop({ video: true });
}