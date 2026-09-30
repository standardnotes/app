package com.standardnotes;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;

import androidx.activity.OnBackPressedCallback;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

public class MainActivity extends ReactActivity {

    private final OnBackPressedCallback backPressedCallback =
            new OnBackPressedCallback(true) {
                @Override
                public void handleOnBackPressed() {
                    setEnabled(false);
                    MainActivity.this.onBackPressed();
                    setEnabled(true);
                }
            };

    private boolean usesTargetSdk36BackWorkaround() {
        return Build.VERSION.SDK_INT >= 36
                && getApplicationInfo().targetSdkVersion >= 36;
    }

    @Override
    protected String getMainComponentName() {
        return "StandardNotes";
    }

    @Override
    protected void onCreate(Bundle savedInstance) {
         super.onCreate(null);
         if (usesTargetSdk36BackWorkaround()) {
             getOnBackPressedDispatcher().addCallback(this, backPressedCallback);
         }
    }

    /**
     * Returns the instance of the {@link ReactActivityDelegate}. Here we use a util class {@link
     * DefaultReactActivityDelegate} which allows you to easily enable Fabric and Concurrent React
     * (aka React 18) with two boolean flags.
     */
    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new DefaultReactActivityDelegate(
        this,
        getMainComponentName(),
        // If you opted-in for the New Architecture, we enable the Fabric Renderer.
        DefaultNewArchitectureEntryPoint.getFabricEnabled());
    }

    /*
     On back button press, background app instead of quitting it
     https://github.com/facebook/react-native/issues/13775
     */
    @Override
    public void invokeDefaultOnBackPressed() {
        if (usesTargetSdk36BackWorkaround()) {
            backPressedCallback.setEnabled(false);
        }
        moveTaskToBack(true);
        if (usesTargetSdk36BackWorkaround()) {
            backPressedCallback.setEnabled(true);
        }
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
    }
}
