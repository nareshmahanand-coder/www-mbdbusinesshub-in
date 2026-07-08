package com.merabharatdukaan.app2;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.content.Context;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;
import com.getcapacitor.WebViewListener;
import org.json.JSONObject;
import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {
    private static final String APP_ORIGIN = "https://shop.mbdbusinesshub.in";
    private static final String TAG_TTS = "MBD Native TTS";
    private TextToSpeech mbdTextToSpeech;
    private boolean mbdTtsReady = false;
    private boolean mbdTtsFailed = false;

    @Override
    protected void load() {
        initMbdNativeTts();
        super.load();
        createUrgentNotificationChannel();
        configureWebView();
        handleNativeAuthIntent(getIntent());
        if (bridge != null) {
            bridge.addWebViewListener(new WebViewListener() {
                @Override
                public boolean onRenderProcessGone(WebView webView, RenderProcessGoneDetail detail) {
                    try {
                        if (webView != null) webView.destroy();
                    } catch (Exception ignored) {}
                    recreate();
                    return true;
                }
            });
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleNativeAuthIntent(intent);
    }

    private void handleNativeAuthIntent(Intent intent) {
        if (intent == null || intent.getData() == null || bridge == null) return;

        Uri uri = intent.getData();
        String callbackUrl = toWebAuthCallbackUrl(uri);
        if (callbackUrl == null) {
            return;
        }

        try {
            JSONObject payload = new JSONObject();
            payload.put("url", callbackUrl);
            bridge.triggerWindowJSEvent("mbd-native-auth-url", payload.toString());
        } catch (Exception ignored) {}

        try {
            if (bridge.getWebView() != null) {
                bridge.getWebView().post(() -> bridge.getWebView().loadUrl(callbackUrl));
            }
        } catch (Exception ignored) {}
    }

    private String toWebAuthCallbackUrl(Uri uri) {
        if (uri == null || uri.getPath() == null) return null;

        boolean isCustomCallback = "com.merabharatdukaan.app2".equals(uri.getScheme())
            && "auth".equals(uri.getHost())
            && uri.getPath().startsWith("/callback");
        boolean isHttpsCallback = "https".equals(uri.getScheme())
            && "shop.mbdbusinesshub.in".equals(uri.getHost())
            && uri.getPath().startsWith("/auth/callback");

        if (isHttpsCallback) return uri.toString();
        if (!isCustomCallback) return null;

        StringBuilder callback = new StringBuilder(APP_ORIGIN).append("/auth/callback");
        String query = uri.getEncodedQuery();
        String fragment = uri.getEncodedFragment();
        if (query != null && !query.isEmpty()) callback.append('?').append(query);
        if (fragment != null && !fragment.isEmpty()) callback.append('#').append(fragment);
        return callback.toString();
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN
            && requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {
            PluginHandle pluginHandle = getBridge().getPlugin("SocialLogin");
            if (pluginHandle == null) {
                Log.i("Google Activity Result", "SocialLogin plugin handle is null");
                return;
            }

            Plugin plugin = pluginHandle.getInstance();
            if (!(plugin instanceof SocialLoginPlugin)) {
                Log.i("Google Activity Result", "SocialLogin plugin instance is not SocialLoginPlugin");
                return;
            }

            ((SocialLoginPlugin) plugin).handleGoogleLoginIntent(requestCode, data);
        }
    }

    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}

    @Override
    protected void onDestroy() {
        try {
            if (mbdTextToSpeech != null) {
                mbdTextToSpeech.stop();
                mbdTextToSpeech.shutdown();
            }
        } catch (Exception ignored) {}
        super.onDestroy();
    }

    private void configureWebView() {
        if (bridge == null || bridge.getWebView() == null) return;
        WebView webView = bridge.getWebView();
        WebSettings settings = webView.getSettings();
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setJavaScriptEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        // Render the responsive mobile layout at true device width — no
        // desktop zoom-out, no cropping. Full-screen mobile app feel.
        settings.setLoadWithOverviewMode(false);
        settings.setUseWideViewPort(true);
        settings.setTextZoom(100);
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        webView.setInitialScale(100);
        webView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);
        webView.addJavascriptInterface(new MbdNativeTtsBridge(), "MbdNativeTts");

        Window window = getWindow();
        window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(true);
            WindowInsetsController controller = window.getInsetsController();
            if (controller != null) {
                controller.show(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
            }
        }
    }

    private void initMbdNativeTts() {
        try {
            mbdTextToSpeech = new TextToSpeech(getApplicationContext(), status -> {
                if (status == TextToSpeech.SUCCESS) {
                    mbdTtsReady = true;
                    mbdTtsFailed = false;
                    try {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                            mbdTextToSpeech.setAudioAttributes(new AudioAttributes.Builder()
                                .setUsage(AudioAttributes.USAGE_ASSISTANCE_ACCESSIBILITY)
                                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                                .build());
                        }
                        mbdTextToSpeech.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                            @Override
                            public void onStart(String utteranceId) {
                                dispatchTtsEvent("start", utteranceId, null);
                            }

                            @Override
                            public void onDone(String utteranceId) {
                                dispatchTtsEvent("end", utteranceId, null);
                            }

                            @Override
                            public void onError(String utteranceId) {
                                dispatchTtsEvent("error", utteranceId, "Android TTS playback failed");
                            }

                            @Override
                            public void onError(String utteranceId, int errorCode) {
                                dispatchTtsEvent("error", utteranceId, "Android TTS playback failed: " + errorCode);
                            }
                        });
                    } catch (Exception e) {
                        Log.w(TAG_TTS, "TTS listener setup failed", e);
                    }
                    Log.i(TAG_TTS, "Android TextToSpeech initialized");
                } else {
                    mbdTtsReady = false;
                    mbdTtsFailed = true;
                    Log.e(TAG_TTS, "Android TextToSpeech init failed: " + status);
                    dispatchTtsEvent("error", null, "Android TTS engine not initialized");
                }
            });
        } catch (Exception e) {
            mbdTtsReady = false;
            mbdTtsFailed = true;
            Log.e(TAG_TTS, "Android TextToSpeech creation failed", e);
        }
    }

    private void dispatchTtsEvent(String event, String utteranceId, String message) {
        try {
            if (bridge == null || bridge.getWebView() == null) return;
            JSONObject detail = new JSONObject();
            if (utteranceId != null) detail.put("utteranceId", utteranceId);
            if (message != null) detail.put("message", message);
            String js = "window.dispatchEvent(new CustomEvent('mbd-native-tts-" + event + "', { detail: " + detail.toString() + " }));";
            bridge.getWebView().post(() -> bridge.getWebView().evaluateJavascript(js, null));
        } catch (Exception ignored) {}
    }

    private Locale localeFromTag(String tag) {
        String safeTag = (tag == null || tag.trim().isEmpty()) ? "hi-IN" : tag.trim();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            return Locale.forLanguageTag(safeTag);
        }
        String[] parts = safeTag.split("[-_]");
        if (parts.length >= 2) return new Locale(parts[0], parts[1]);
        return new Locale(parts[0]);
    }

    private ArrayList<Locale> ttsLocaleCandidates(String requestedLang) {
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

    private class MbdNativeTtsBridge {
        @JavascriptInterface
        public boolean isReady() {
            return mbdTtsReady && mbdTextToSpeech != null;
        }

        @JavascriptInterface
        public boolean isAvailable() {
            return mbdTextToSpeech != null && !mbdTtsFailed;
        }

        @JavascriptInterface
        public void openInstall() {
            try {
                Intent installIntent = new Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA);
                installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(installIntent);
            } catch (Exception e) {
                Log.w(TAG_TTS, "Unable to open TTS install screen", e);
            }
        }

        @JavascriptInterface
        public void stop() {
            runOnUiThread(() -> {
                try {
                    if (mbdTextToSpeech != null) mbdTextToSpeech.stop();
                } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public String speak(String text, String lang, float rate, float pitch, float volume) {
            final String utteranceId = "mbd-tts-" + System.currentTimeMillis();
            if (text == null || text.trim().isEmpty()) return "EMPTY";
            runOnUiThread(() -> speakOnUiThread(utteranceId, text, lang, rate, pitch, volume));
            return utteranceId;
        }

        private void speakOnUiThread(String utteranceId, String text, String lang, float rate, float pitch, float volume) {
            if (mbdTextToSpeech == null || !mbdTtsReady) {
                dispatchTtsEvent("error", utteranceId, "Android TTS engine is still initializing");
                return;
            }

            try {
                mbdTextToSpeech.stop();
                mbdTextToSpeech.setSpeechRate(Math.max(0.1f, Math.min(2.0f, rate)));
                mbdTextToSpeech.setPitch(Math.max(0.1f, Math.min(2.0f, pitch)));

                Locale selectedLocale = null;
                for (Locale candidate : ttsLocaleCandidates(lang)) {
                    int availability = mbdTextToSpeech.isLanguageAvailable(candidate);
                    if (availability != TextToSpeech.LANG_MISSING_DATA && availability != TextToSpeech.LANG_NOT_SUPPORTED) {
                        int setResult = mbdTextToSpeech.setLanguage(candidate);
                        if (setResult != TextToSpeech.LANG_MISSING_DATA && setResult != TextToSpeech.LANG_NOT_SUPPORTED) {
                            selectedLocale = candidate;
                            break;
                        }
                    }
                }

                if (selectedLocale == null) {
                    openInstall();
                    dispatchTtsEvent("error", utteranceId, "No supported Android TTS language found");
                    return;
                }

                Bundle params = new Bundle();
                params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, Math.max(0.0f, Math.min(1.0f, volume)));
                int result;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    result = mbdTextToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, params, utteranceId);
                } else {
                    @SuppressWarnings("deprecation")
                    java.util.HashMap<String, String> legacyParams = new java.util.HashMap<>();
                    legacyParams.put(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId);
                    legacyParams.put(TextToSpeech.Engine.KEY_PARAM_VOLUME, String.valueOf(Math.max(0.0f, Math.min(1.0f, volume))));
                    @SuppressWarnings("deprecation")
                    int legacyResult = mbdTextToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, legacyParams);
                    result = legacyResult;
                }

                if (result == TextToSpeech.ERROR) {
                    dispatchTtsEvent("error", utteranceId, "Android TTS speak returned error");
                } else {
                    Log.i(TAG_TTS, "Speaking via direct Android bridge, lang=" + selectedLocale.toLanguageTag());
                }
            } catch (Exception e) {
                Log.e(TAG_TTS, "Direct Android TTS failed", e);
                dispatchTtsEvent("error", utteranceId, e.getMessage() != null ? e.getMessage() : "Android TTS failed");
            }
        }
    }

    private void createUrgentNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        Uri soundUri = Uri.parse("android.resource://" + getPackageName() + "/raw/mbd_alert");
        AudioAttributes audioAttributes = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build();

        NotificationChannel channel = new NotificationChannel(
            "mbd_urgent_v2",
            "Mera Bharat Dukaan Urgent Alerts",
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("High-priority admin messages with sound");
        channel.setSound(soundUri, audioAttributes);
        channel.enableVibration(true);
        channel.enableLights(true);
        channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
        manager.createNotificationChannel(channel);
    }
}
