import { useSafeApplicationContext } from '@Root/Hooks/useSafeApplicationContext'
import React, { useCallback, useRef } from 'react'
import { Platform } from 'react-native'
import { WebView } from 'react-native-webview'

export const MobileWebAppContainer = () => {
  const application = useSafeApplicationContext()

  const webviewRef = useRef<WebView>(null)

  const sourceUri = (Platform.OS === 'android' ? 'file:///android_asset/' : '') + 'Web.bundle/loader.html'
  const params = 'platform=' + Platform.OS

  const injectedJSBeforeIsLoaded = `
    // TODO: should cleanup 'mobileApplication' from 'window' somewhere to avoid memory leaks
    // window.mobileApplication = ${application}  // "mobile application is undefined"
    window.mobileApplication = {key: 'app val 1', key2: 'app val 2'} // "mobile application is [Object object]"
    true;
  `

  const injectedJS = `
    // window.mobileApplication = ${application}  // WebView is a blank screen
    
    if (!window.location.search) {
      var link = document.getElementById('web-bundle-progress-bar');
      link.href = './src/index.html?${params}';
      link.click();
    }
    true; // note: this is required, or you'll sometimes get silent failures
    `

  const sendDataToWebView = useCallback(() => {
    if (!webviewRef.current) {
      return
    }
    webviewRef.current.postMessage('message from mobile!')
    webviewRef.current.postMessage(JSON.stringify({ key: 'val 1', key2: 'val 2' }))
  }, [])

  /* eslint-disable @typescript-eslint/no-empty-function */
  return (
    <WebView
      source={{ uri: sourceUri }}
      ref={webviewRef}
      originWhitelist={['*']}
      onLoad={() => {
        sendDataToWebView()
      }}
      onLoadEnd={() => {}}
      onError={(err) => console.error('An error has occurred', err)}
      onHttpError={() => console.error('An HTTP error occurred')}
      onMessage={() => {
        console.log('In `onMessage`')
      }}
      allowFileAccess={true}
      injectedJavaScript={injectedJS}
      injectedJavaScriptBeforeContentLoaded={injectedJSBeforeIsLoaded}
    />
  )
  /* eslint-enable @typescript-eslint/no-empty-function */
}
