package com.standardnotes;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.IntentSender;
import android.util.Log;
import android.util.Base64;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
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
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;

public class Fido2ApiModule extends ReactContextBaseJavaModule {
  private final Fido2ApiClient fido2ApiClient;
  private final ReactApplicationContext reactContext;
  private static final int SIGN_REQUEST_CODE = 111;

  private final ActivityEventListener activityEventListener = new BaseActivityEventListener() {
    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent intent) {
      super.onActivityResult(activity, requestCode, resultCode, intent);

      if (requestCode == SIGN_REQUEST_CODE) {
        if (resultCode == Activity.RESULT_OK) {
          byte[] response = intent.getByteArrayExtra(Fido.FIDO2_KEY_RESPONSE_EXTRA);
          String responseString = Base64.encodeToString(response, Base64.DEFAULT);
          Log.i("Fido2ApiModule", "FIDO response: " + responseString);
        } else {
          Log.e("Fido2ApiModule", "FIDO sign in failed");
        }
      }
    }
  };

  Fido2ApiModule(ReactApplicationContext context) {
    super(context);

    fido2ApiClient = Fido.getFido2ApiClient(context);
    context.addActivityEventListener(activityEventListener);

    this.reactContext = context;
  }

  @Override
  public String getName() {
    return "Fido2ApiModule";
  }

  @ReactMethod
  public void promptForU2FAuthentication(String authenticationOptionsJSONString) throws JSONException {
    Log.i("Fido2ApiModule", "Prompt for U2F sign in with options: " + authenticationOptionsJSONString);

    JSONObject authenticationOptions = new JSONObject(authenticationOptionsJSONString);

    ArrayList<PublicKeyCredentialDescriptor> allowedKeys = new ArrayList<PublicKeyCredentialDescriptor>();

    JSONArray keyHandles = authenticationOptions.getJSONArray("allowCredentials");
    for (int i = 0, size = keyHandles.length(); i < size; i++) {
      JSONObject keyHandle = keyHandles.getJSONObject(i);
      allowedKeys.add(
        new PublicKeyCredentialDescriptor(
          PublicKeyCredentialType.PUBLIC_KEY.toString(),
          keyHandle.getString("id").getBytes(),
          null
        )
      );
    }

    PublicKeyCredentialRequestOptions.Builder optionsBuilder = new PublicKeyCredentialRequestOptions
      .Builder()
      .setRpId("app.standardnotes.com")
      .setAllowList(allowedKeys)
      .setChallenge(authenticationOptions.getString("challenge").getBytes())
      .setTimeoutSeconds(authenticationOptions.getDouble("timeout"));

    PublicKeyCredentialRequestOptions options = optionsBuilder.build();

    Task result = this.fido2ApiClient.getSignPendingIntent(options);

    final Activity activity = this.reactContext.getCurrentActivity();

    result.addOnSuccessListener(
      new OnSuccessListener<PendingIntent>() {
        @Override
        public void onSuccess(PendingIntent fido2PendingIntent) {
          if (fido2PendingIntent == null) {
            Log.e("Fido2ApiModule", "No pending FIDO intent returned");
            return;
          }

          try {
            activity.startIntentSenderForResult(
              fido2PendingIntent.getIntentSender(),
              SIGN_REQUEST_CODE,
              null,
              0,
              0,
              0
            );
          } catch (IntentSender.SendIntentException exception) {
            Log.e("Fido2ApiModule", "Error starting FIDO intent: " + exception.getMessage());
          }
        }
      }
    );

    result.addOnFailureListener(
      new OnFailureListener() {
        @Override
        public void onFailure(Exception e) {
          Log.e("Fido2ApiModule", "Error getting FIDO intent: " + e.getMessage());
        }
      }
    );
  }
}
