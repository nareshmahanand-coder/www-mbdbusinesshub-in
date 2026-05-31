package com.merabharatdukaan.app;

import android.Manifest;
import android.os.Build;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "PushNotifications",
    permissions = @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = SafePushNotificationsPlugin.PUSH_NOTIFICATIONS)
)
public class SafePushNotificationsPlugin extends Plugin {
    static final String PUSH_NOTIFICATIONS = "receive";
    private static final String FIREBASE_DISABLED_MESSAGE =
        "Push notifications are disabled because Firebase is not configured for this Android build.";

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject result = new JSObject();
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            result.put("receive", "granted");
            call.resolve(result);
            return;
        }
        super.checkPermissions(call);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU || getPermissionState(PUSH_NOTIFICATIONS) == PermissionState.GRANTED) {
            JSObject result = new JSObject();
            result.put("receive", "granted");
            call.resolve(result);
            return;
        }
        requestPermissionForAlias(PUSH_NOTIFICATIONS, call, "permissionsCallback");
    }

    @PluginMethod
    public void register(PluginCall call) {
        sendRegistrationError();
        call.resolve();
    }

    @PluginMethod
    public void unregister(PluginCall call) {
        call.resolve();
    }

    @PluginMethod
    public void getDeliveredNotifications(PluginCall call) {
        JSObject result = new JSObject();
        result.put("notifications", new JSArray());
        call.resolve(result);
    }

    @PluginMethod
    public void removeDeliveredNotifications(PluginCall call) {
        call.resolve();
    }

    @PluginMethod
    public void removeAllDeliveredNotifications(PluginCall call) {
        call.resolve();
    }

    @PluginMethod
    public void createChannel(PluginCall call) {
        call.resolve();
    }

    @PluginMethod
    public void deleteChannel(PluginCall call) {
        call.resolve();
    }

    @PluginMethod
    public void listChannels(PluginCall call) {
        JSObject result = new JSObject();
        result.put("channels", new JSArray());
        call.resolve(result);
    }

    private void sendRegistrationError() {
        JSObject data = new JSObject();
        data.put("error", FIREBASE_DISABLED_MESSAGE);
        notifyListeners("registrationError", data, true);
    }

    @PermissionCallback
    private void permissionsCallback(PluginCall call) {
        this.checkPermissions(call);
    }
}