package com.standardnotes;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.content.res.Configuration;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;

public class MainActivity extends ReactActivity {

    @Override
    protected String getMainComponentName() {
        return "StandardNotes";
    }

    @Override
    protected void onCreate(Bundle savedInstance) {
         super.onCreate(null);
    }

    /**
     * Returns the instance of the {@link ReactActivityDelegate}. There the RootView is created and
     * you can specify the renderer you wish to use - the new renderer (Fabric) or the old renderer
     * (Paper).
     */
    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new SNReactActivityDelegate(this, getMainComponentName());
    }


    public static class SNReactActivityDelegate extends ReactActivityDelegate {
        public SNReactActivityDelegate(ReactActivity activity, String mainComponentName) {
            super(activity, mainComponentName);
        }

        @Override
        protected ReactRootView createRootView() {
            ReactRootView reactRootView = new ReactRootView(getContext());
            // If you opted-in for the New Architecture, we enable the Fabric Renderer.
            reactRootView.setIsFabric(BuildConfig.IS_NEW_ARCHITECTURE_ENABLED);
            return reactRootView;
        }

        @Override
        protected Bundle getLaunchOptions() {
            String packageName = this.getContext().getPackageName();
            Bundle props = new Bundle();
            SharedPreferences settings = this.getContext().getSharedPreferences("react-native", Context.MODE_PRIVATE);
            return props;
        }

        @Override
        protected boolean isConcurrentRootEnabled() {
          // If you opted-in for the New Architecture, we enable Concurrent Root (i.e. React 18).
          // More on this on https://reactjs.org/blog/2022/03/29/react-v18.html
          return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
        }
    }



    // Fix for Dark theme subscriptions https://github.com/facebook/react-native/issues/28823#issuecomment-642032481
    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        getReactInstanceManager().onConfigurationChanged(this, newConfig);
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
