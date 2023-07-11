// Adapted from
// https://github.com/ajith-ab/react-native-receive-sharing-intent

package com.standardnotes;

import android.app.Activity;
import android.app.Application;
import android.content.Intent;


import android.os.Build;
import androidx.annotation.RequiresApi;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;


public class ReceiveSharingIntentModule extends ReactContextBaseJavaModule {
  public final String Log_Tag = "ReceiveSharingIntent";

  private final ReactApplicationContext reactContext;
  private ReceiveSharingIntentHelper receiveSharingIntentHelper;

  public ReceiveSharingIntentModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
    Application applicationContext = (Application) reactContext.getApplicationContext();
    receiveSharingIntentHelper = new ReceiveSharingIntentHelper(applicationContext);
  }


  protected void onNewIntent(Intent intent) {
    Activity mActivity = getCurrentActivity();
    if(mActivity == null) { return; }
    mActivity.setIntent(intent);
  }

  @RequiresApi(api = Build.VERSION_CODES.KITKAT)
  @ReactMethod
  public void getFileNames(Promise promise){
    Activity mActivity = getCurrentActivity();
    if(mActivity == null) { return; }
    Intent intent = mActivity.getIntent();
    if(intent == null) { return; }
    receiveSharingIntentHelper.sendFileNames(reactContext, intent, promise);
    mActivity.setIntent(null);
  }

  @ReactMethod
  public void clearFileNames(){
    Activity mActivity = getCurrentActivity();
    if(mActivity == null) { return; }
    Intent intent = mActivity.getIntent();
    if(intent == null) { return; }
    receiveSharingIntentHelper.clearFileNames(intent);
  }


  @Override
  public String getName() {
    return "ReceiveSharingIntent";
  }
}
