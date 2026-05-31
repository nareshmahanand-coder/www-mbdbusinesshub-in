package com.merabharatdukaan.app;

import android.content.Context;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;
import java.lang.reflect.Method;

public class MainActivity extends BridgeActivity {
    @Override
    protected void load() {
        boolean firebaseReady = isFirebaseConfigured() && initializeFirebaseIfAvailable(this);
        if (!firebaseReady) {
            registerPlugin(SafePushNotificationsPlugin.class);
        }
        super.load();
        configureWebView();
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

    private void configureWebView() {
        if (bridge == null || bridge.getWebView() == null) return;
        WebView webView = bridge.getWebView();
        WebSettings settings = webView.getSettings();
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setJavaScriptEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setLoadWithOverviewMode(false);
        settings.setUseWideViewPort(false);
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
    }

    private boolean isFirebaseConfigured() {
        int googleAppId = getResources().getIdentifier("google_app_id", "string", getPackageName());
        if (googleAppId == 0) return false;
        String appId = getString(googleAppId);
        return appId != null && !appId.trim().isEmpty();
    }

    private boolean initializeFirebaseIfAvailable(Context context) {
        try {
            Class<?> firebaseAppClass = Class.forName("com.google.firebase.FirebaseApp");
            Method getApps = firebaseAppClass.getMethod("getApps", Context.class);
            Object apps = getApps.invoke(null, context);
            if (apps instanceof java.util.List && !((java.util.List<?>) apps).isEmpty()) return true;

            Method initializeApp = firebaseAppClass.getMethod("initializeApp", Context.class);
            Object app = initializeApp.invoke(null, context);
            return app != null;
        } catch (Throwable ignored) {
            return false;
        }
    }
}
