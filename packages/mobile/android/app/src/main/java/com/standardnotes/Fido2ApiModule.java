package com.standardnotes;

import android.util.Log;
import android.util.Base64;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONException;

import com.google.android.gms.fido.fido2.Fido2ApiClient;
import com.google.android.gms.fido.fido2.api.common.PublicKeyCredentialType;
import com.google.android.gms.fido.fido2.api.common.PublicKeyCredentialDescriptor;
import com.google.android.gms.fido.fido2.api.common.PublicKeyCredentialRequestOptions;
import com.google.android.gms.fido.fido2.api.common.PublicKeyCredentialRequestOptions;
import com.google.android.gms.fido.Fido;
import com.google.android.gms.tasks.Task;

public class Fido2ApiModule extends ReactContextBaseJavaModule {
  private final Fido2ApiClient fido2ApiClient;

  Fido2ApiModule(ReactApplicationContext context) {
    super(context);

    fido2ApiClient = Fido.getFido2ApiClient(context);
  }

  @Override
  public String getName() {
    return "Fido2ApiModule";
  }

  @ReactMethod
  public void promptForU2FAuthentication(String authenticationOptionsJSONString) throws JSONException {
    Log.i("Fido2ApiModule", "Prompt for U2F sign in with options: " + authenticationOptionsJSONString);

    JSONObject authenticationOptions = null;
    try {
      authenticationOptions = new JSONObject(authenticationOptionsJSONString);
    } catch (JSONException e) {
      Log.e("Fido2ApiModule", "Error parsing JSON: " + e.getMessage());

      return;
    }

    ArrayList<PublicKeyCredentialDescriptor> allowedKeys = new ArrayList<PublicKeyCredentialDescriptor>();

    JSONArray keyHandles = authenticationOptions.getJSONArray("allowCredentials");
    for (int i = 0, size = keyHandles.length(); i < size; i++) {
      JSONObject keyHandle = keyHandles.getJSONObject(i);
      byte[] keyHandleByte = Base64.decode(keyHandle.getString("id"), Base64.DEFAULT);
      allowedKeys.add(
        new PublicKeyCredentialDescriptor(
          PublicKeyCredentialType.PUBLIC_KEY.toString(),
          keyHandleByte,
          null
        )
      );
    }

    PublicKeyCredentialRequestOptions.Builder optionsBuilder = new PublicKeyCredentialRequestOptions
      .Builder()
      .setRpId("app.standardnotes.com")
      .setAllowList(allowedKeys)
      .setChallenge(Base64.decode(authenticationOptions.getString("challenge"), Base64.DEFAULT))
      .setTimeoutSeconds(authenticationOptions.getDouble("timeout"));

    PublicKeyCredentialRequestOptions options = optionsBuilder.build();

    Task result = this.fido2ApiClient.getSignPendingIntent(options);
  }
}
