package com.standardnotes;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.IntentSender;
import android.util.Base64;
import android.util.Log;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONException;

import com.google.android.gms.fido.fido2.Fido2ApiClient;
import com.google.android.gms.fido.fido2.api.common.AuthenticatorErrorResponse;
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

  private static final String LOGS_TAG = "Fido2ApiModule";
  private static final String RP_ID = "app.standardnotes.com";

  private Promise signInPromise;

  private final ActivityEventListener activityEventListener = new BaseActivityEventListener() {
    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent intent) {
      super.onActivityResult(activity, requestCode, resultCode, intent);

      if (requestCode == SIGN_REQUEST_CODE) {
        if (resultCode == Activity.RESULT_OK) {
          if (intent.hasExtra(Fido.FIDO2_KEY_ERROR_EXTRA)) {
            AuthenticatorErrorResponse authenticatorErrorResponse =
              AuthenticatorErrorResponse.deserializeFromBytes(intent.getByteArrayExtra(Fido.FIDO2_KEY_ERROR_EXTRA));
            Log.e(LOGS_TAG, "FIDO2_KEY_ERROR_EXTRA Security Key: " + authenticatorErrorResponse.getErrorMessage());

            signInPromise.reject("FIDO2_KEY_ERROR_EXTRA", authenticatorErrorResponse.getErrorMessage());

            signInPromise = null;

            return;
          }

          Log.i(LOGS_TAG, "FIDO response OK");
          signInPromise.resolve("OK");
        } else {
          Log.e(LOGS_TAG, "FIDO sign in failed");
          signInPromise.reject("FIDO_SIGN_IN_FAILED", "FIDO sign in failed");
        }

        signInPromise = null;
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
  public void promptForU2FAuthentication(String authenticationOptionsJSONString, Promise promise) throws JSONException {
    Log.i(LOGS_TAG, "Prompt for U2F sign in with options: " + authenticationOptionsJSONString);

    signInPromise = promise;

    JSONObject authenticationOptions = new JSONObject(authenticationOptionsJSONString);

    ArrayList<PublicKeyCredentialDescriptor> allowedKeys = new ArrayList<PublicKeyCredentialDescriptor>();

    JSONArray allowedCredentials = authenticationOptions.getJSONArray("allowCredentials");
    for (int i = 0, size = allowedCredentials.length(); i < size; i++) {
      JSONObject allowedCredential = allowedCredentials.getJSONObject(i);
      Log.i(LOGS_TAG, "Adding credential id: " + allowedCredential.getString("id"));

      allowedKeys.add(
        new PublicKeyCredentialDescriptor(
          PublicKeyCredentialType.PUBLIC_KEY.toString(),
          this.convertBase64URLStringToBytes(allowedCredential.getString("id")),
          null
        )
      );
    }

    String challenge = authenticationOptions.getString("challenge");
    Double timeout = authenticationOptions.getDouble("timeout");
    Log.i(LOGS_TAG, "Challenge: " + challenge);
    Log.i(LOGS_TAG, "Timeout: " + timeout);
    Log.i(LOGS_TAG, "RP ID: " + RP_ID);
    Log.i(LOGS_TAG, "Allowed keys size: " + allowedKeys.size());

    PublicKeyCredentialRequestOptions.Builder optionsBuilder = new PublicKeyCredentialRequestOptions
      .Builder()
      .setRpId(RP_ID)
      .setAllowList(allowedKeys)
      .setChallenge(this.convertBase64URLStringToBytes(challenge))
      .setTimeoutSeconds(timeout);

    PublicKeyCredentialRequestOptions options = optionsBuilder.build();

    Task result = this.fido2ApiClient.getSignPendingIntent(options);

    final Activity activity = this.reactContext.getCurrentActivity();

    result.addOnSuccessListener(
      new OnSuccessListener<PendingIntent>() {
        @Override
        public void onSuccess(PendingIntent fido2PendingIntent) {
          if (fido2PendingIntent == null) {
            Log.e(LOGS_TAG, "No pending FIDO intent returned");
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
            Log.e(LOGS_TAG, "Error starting FIDO intent: " + exception.getMessage());
          }
        }
      }
    );

    result.addOnFailureListener(
      new OnFailureListener() {
        @Override
        public void onFailure(Exception e) {
          Log.e(LOGS_TAG, "Error getting FIDO intent: " + e.getMessage());
          signInPromise.reject("unknown", e.getMessage());
        }
      }
    );
  }

  private byte[] convertBase64URLStringToBytes(String base64URLString) {
    String base64String = base64URLString.replace('-', '+').replace('_', '/');
    int padding = (4 - (base64String.length() % 4)) % 4;
    for (int i = 0; i < padding; i++) {
      base64String += '=';
    }

    byte[] decoded = Base64.decode(base64String, Base64.DEFAULT);

    return decoded;
  }
}
