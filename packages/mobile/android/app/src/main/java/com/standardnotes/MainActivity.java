package com.standardnotes;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.content.res.Configuration;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;

public class MainActivity extends ReactActivity {

     @Override
    protected void onCreate(Bundle savedInstance) {
         super.onCreate(null);
    }

    public static class SNReactActivityDelegate extends ReactActivityDelegate {
        public SNReactActivityDelegate(ReactActivity activity, String mainComponentName) {
            super(activity, mainComponentName);
        }

        @Override
        protected Bundle getLaunchOptions() {
            String packageName = this.getContext().getPackageName();
            Bundle props = new Bundle();
            SharedPreferences settings = this.getContext().getSharedPreferences("react-native", Context.MODE_PRIVATE);
            return props;
        }
    }

    @Override
    protected String getMainComponentName() {
      return "StandardNotes";
    }

    // Fix for Dark theme subscriptions https://github.com/facebook/react-native/issues/28823#issuecomment-642032481
    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        getReactInstanceManager().onConfigurationChanged(this, newConfig);
    }

    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new SNReactActivityDelegate(this, getMainComponentName()) {
        @Override
        protected ReactRootView createRootView() {
          return new RNGestureHandlerEnabledRootView(MainActivity.this);
        }
      };
    }

    /*
     On back button press, background app instead of quitting it
     https://github.com/facebook/react-native/issues/13775
     */
    @Override
    public void invokeDefaultOnBackPressed() {
        moveTaskToBack(true);
    }
}
