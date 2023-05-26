package com.standardnotes;

import com.reactnativecommunity.webview.RNCWebViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import android.view.inputmethod.InputConnectionWrapper;
import com.facebook.react.module.annotations.ReactModule;
import android.view.KeyEvent;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputConnection;
import android.webkit.WebView;

@ReactModule(name = CustomWebViewManager.REACT_CLASS)
public class CustomWebViewManager extends RNCWebViewManager {
	/* This name must match what we’re referring to in JS */
	protected static final String REACT_CLASS = "CustomWebView";

	protected static class CustomWebViewClient extends RNCWebViewClient {}

	protected static class CustomWebView extends RNCWebView {
		public CustomWebView(ThemedReactContext reactContext) {
			super(reactContext);
		}

		@Override
		public InputConnection onCreateInputConnection(EditorInfo outAttrs) {
			InputConnection con = super.onCreateInputConnection(outAttrs);
			if (con == null) {
				return null;
			}
			return new CustomInputConnection(con, true);
		}

		private class CustomInputConnection extends InputConnectionWrapper {
			public CustomInputConnection(InputConnection target, boolean mutable) {
				super(target, mutable);
			}

			@Override
			public boolean sendKeyEvent(KeyEvent event) {
				if (event.getAction() == KeyEvent.ACTION_DOWN && event.getKeyCode() == KeyEvent.KEYCODE_DEL) {
					// Un-comment if you wish to cancel the backspace:
					// return false;
				}
				return super.sendKeyEvent(event);
			}

			@Override
			public boolean deleteSurroundingText(int beforeLength, int afterLength) {       
				// magic: in latest Android, deleteSurroundingText(1, 0) will be called for backspace
				if (beforeLength == 1 && afterLength == 0) {
					// backspace
					return sendKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_DEL)) 
						&& sendKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_DEL));
				}
				return super.deleteSurroundingText(beforeLength, afterLength);
			}
		}
	}

	@Override
	protected RNCWebView createRNCWebViewInstance(ThemedReactContext reactContext) {
		return new CustomWebView(reactContext);
	}

	@Override
	public String getName() {
		return REACT_CLASS;
	}

	@Override
	protected void addEventEmitters(ThemedReactContext reactContext, WebView view) {
		view.setWebViewClient(new CustomWebViewClient());
	}
}