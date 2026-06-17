package com.merabharatdukaan.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {
    @Override
    protected void load() {
        super.load();
        createUrgentNotificationChannel();
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
        // Native app is intentionally a full desktop-site view by default.
        // WebView should honor the 1280px viewport and zoom out to fit width.
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setTextZoom(100);
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        webView.setInitialScale(0);
        webView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);

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
