package com.standardnotes


import android.annotation.SuppressLint
import android.app.Activity
import android.app.Application
import android.database.CursorWindow
import android.os.Bundle
import android.view.WindowManager
import android.webkit.WebView
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.modules.network.OkHttpClientProvider
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import com.kristiansorens.flagsecure.FlagSecure
import java.io.IOException
import java.lang.reflect.Field

class MainApplication : Application(), ReactApplication {

    override val reactNativeHost: ReactNativeHost = object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
                // Packages that cannot be autolinked yet can be added manually here, for example:
                // add(MyReactNativePackage())
                add(Fido2ApiPackage())
                add(CustomWebViewPackage())
                add(ReceiveSharingIntentPackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
    }

    override val reactHost: ReactHost
        get() = getDefaultReactHost(applicationContext, reactNativeHost)

    @SuppressLint("NewApi")
    override fun onCreate() {
        super.onCreate()

        // Enable Remote debugging for WebViews
        val packageName = applicationContext.packageName
        if (packageName == "com.standardnotes.dev") {
            WebView.setWebContentsDebuggingEnabled(true)
        }

        rebuildOkHttp()

        try {
            SoLoader.init(this, OpenSourceMergedSoMapping)
        } catch (e: IOException) {
            throw RuntimeException(e)
        }

        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            load()
        }

        try {
            // Increase CursorWindow size to avoid "Row too big" issue
            val field: Field = CursorWindow::class.java.getDeclaredField("sCursorWindowSize")
            field.isAccessible = true
            field.set(null, 10 * 1024 * 1024)
        } catch (e: Exception) {
            e.printStackTrace()
        }

        registerActivityLifecycleCallbacks(object : ActivityLifecycleCallbacks {
            override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
                activity.window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)
            }

            override fun onActivityStarted(activity: Activity) {
                if (FlagSecure.instance != null && FlagSecure.instance!!.enabled) {
                    activity.window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
                }
            }

            override fun onActivityResumed(activity: Activity) {}

            override fun onActivityPaused(activity: Activity) {}

            override fun onActivityStopped(activity: Activity) {}

            override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}

            override fun onActivityDestroyed(activity: Activity) {}
        })
    }

    private fun rebuildOkHttp() {
        OkHttpClientProvider.setOkHttpClientFactory(CustomClientFactory())
    }
}
