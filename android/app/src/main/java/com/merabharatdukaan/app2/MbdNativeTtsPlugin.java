package com.merabharatdukaan.app2;

import android.content.Intent;
import android.media.AudioAttributes;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;

@CapacitorPlugin(name = "MbdNativeTts")
public class MbdNativeTtsPlugin extends Plugin {
    private static final String TAG = "MBD Native TTS Plugin";
    private TextToSpeech tts;
    private boolean ready = false;
    private boolean failed = false;
    private PluginCall activeSpeakCall;
    private String activeUtteranceId;

    public MbdNativeTtsPlugin() {
        super();
    }

    @Override
    public void load() {
        initTts();
    }

    @Override
    public void handleOnDestroy() {
        try {
            if (tts != null) {
                tts.stop();
                tts.shutdown();
            }
        } catch (Exception ignored) {}
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", tts != null && !failed);
        ret.put("ready", ready && tts != null);
        call.resolve(ret);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                if (tts != null) tts.stop();
                completeActiveCall(true, null);
                call.resolve();
            } catch (Exception e) {
                call.reject(e.getMessage());
            }
        });
    }

    @PluginMethod
    public void openInstall(PluginCall call) {
        try {
            Intent installIntent = new Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA);
            installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(installIntent);
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "");
        String lang = call.getString("lang", "hi-IN");
        Float rate = call.getFloat("rate", 1.0f);
        Float pitch = call.getFloat("pitch", 1.0f);
        Float volume = call.getFloat("volume", 1.0f);

        if (text == null || text.trim().isEmpty()) {
            call.reject("Text is empty");
            return;
        }

        getActivity().runOnUiThread(() -> speakOnUiThread(call, text, lang, rate, pitch, volume));
    }

    private void initTts() {
        try {
            tts = new TextToSpeech(getContext().getApplicationContext(), status -> {
                if (status == TextToSpeech.SUCCESS) {
                    ready = true;
                    failed = false;
                    try {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                            tts.setAudioAttributes(new AudioAttributes.Builder()
                                .setUsage(AudioAttributes.USAGE_MEDIA)
                                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                                .build());
                        }
                        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                            @Override
                            public void onStart(String utteranceId) {}

                            @Override
                            public void onDone(String utteranceId) {
                                if (isActiveUtterance(utteranceId)) completeActiveCall(true, null);
                            }

                            @Override
                            public void onError(String utteranceId) {
                                if (isActiveUtterance(utteranceId)) completeActiveCall(false, "Android TTS playback failed");
                            }

                            @Override
                            public void onError(String utteranceId, int errorCode) {
                                if (isActiveUtterance(utteranceId)) completeActiveCall(false, "Android TTS playback failed: " + errorCode);
                            }
                        });
                    } catch (Exception e) {
                        Log.w(TAG, "TTS listener setup failed", e);
                    }
                    Log.i(TAG, "Android TextToSpeech initialized");
                } else {
                    ready = false;
                    failed = true;
                    Log.e(TAG, "Android TextToSpeech init failed: " + status);
                }
            });
        } catch (Exception e) {
            ready = false;
            failed = true;
            Log.e(TAG, "Android TextToSpeech creation failed", e);
        }
    }

    private void speakOnUiThread(PluginCall call, String text, String lang, Float rate, Float pitch, Float volume) {
        if (tts == null || !ready) {
            call.reject("Android TTS engine is still initializing");
            return;
        }

        try {
            if (activeSpeakCall != null) completeActiveCall(true, null);
            tts.stop();
            tts.setSpeechRate(clamp(rate, 0.1f, 2.0f));
            tts.setPitch(clamp(pitch, 0.1f, 2.0f));

            Locale selectedLocale = null;
            for (Locale candidate : localeCandidates(lang)) {
                int availability = tts.isLanguageAvailable(candidate);
                if (availability != TextToSpeech.LANG_MISSING_DATA && availability != TextToSpeech.LANG_NOT_SUPPORTED) {
                    int setResult = tts.setLanguage(candidate);
                    if (setResult != TextToSpeech.LANG_MISSING_DATA && setResult != TextToSpeech.LANG_NOT_SUPPORTED) {
                        selectedLocale = candidate;
                        break;
                    }
                }
            }

            if (selectedLocale == null) {
                call.reject("No supported Android TTS language found");
                return;
            }

            activeSpeakCall = call;
            activeUtteranceId = "mbd-plugin-tts-" + System.currentTimeMillis();
            int result;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                Bundle params = new Bundle();
                params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, clamp(volume, 0.0f, 1.0f));
                result = tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, activeUtteranceId);
            } else {
                HashMap<String, String> params = new HashMap<>();
                params.put(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, activeUtteranceId);
                params.put(TextToSpeech.Engine.KEY_PARAM_VOLUME, String.valueOf(clamp(volume, 0.0f, 1.0f)));
                @SuppressWarnings("deprecation")
                int legacyResult = tts.speak(text, TextToSpeech.QUEUE_FLUSH, params);
                result = legacyResult;
            }

            if (result == TextToSpeech.ERROR) {
                completeActiveCall(false, "Android TTS speak returned error");
            } else {
                Log.i(TAG, "Speaking via custom native plugin, lang=" + selectedLocale.toLanguageTag());
            }
        } catch (Exception e) {
            Log.e(TAG, "Custom native TTS failed", e);
            call.reject(e.getMessage());
        }
    }

    private boolean isActiveUtterance(String utteranceId) {
        return activeUtteranceId != null && activeUtteranceId.equals(utteranceId);
    }

    private void completeActiveCall(boolean ok, String message) {
        PluginCall call = activeSpeakCall;
        activeSpeakCall = null;
        activeUtteranceId = null;
        if (call == null) return;
        getActivity().runOnUiThread(() -> {
            if (ok) call.resolve();
            else call.reject(message != null ? message : "Android TTS failed");
        });
    }

    private float clamp(Float value, float min, float max) {
        float safe = value == null ? 1.0f : value;
        return Math.max(min, Math.min(max, safe));
    }

    private Locale localeFromTag(String tag) {
        String safeTag = (tag == null || tag.trim().isEmpty()) ? "hi-IN" : tag.trim();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) return Locale.forLanguageTag(safeTag);
        String[] parts = safeTag.split("[-_]");
        if (parts.length >= 2) return new Locale(parts[0], parts[1]);
        return new Locale(parts[0]);
    }

    private ArrayList<Locale> localeCandidates(String requestedLang) {
        Set<String> tags = new LinkedHashSet<>();
        String requested = (requestedLang == null || requestedLang.trim().isEmpty()) ? "hi-IN" : requestedLang.trim();
        tags.add(requested);
        if (requested.contains("-") || requested.contains("_")) tags.add(requested.split("[-_]")[0]);
        tags.add("hi-IN");
        tags.add("hi");
        tags.add("en-IN");
        tags.add("en-US");
        ArrayList<Locale> locales = new ArrayList<>();
        for (String tag : tags) locales.add(localeFromTag(tag));
        return locales;
    }
}