package com.standardnotes;

import android.util.Log;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import java.util.Map;
import java.util.HashMap;

public class Fido2ApiModule extends ReactContextBaseJavaModule {
  Fido2ApiModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  public String getName() {
    return "Fido2ApiModule";
  }

  @ReactMethod
  public void promptForU2FAuthentication(String username) {
     Log.d("Fido2ApiModule", "Prompt for U2F sign in for user: " + username);
  }
}
