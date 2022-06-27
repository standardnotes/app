import React from 'react'
import { Platform } from 'react-native'
import { WebView } from 'react-native-webview'

export const MobileTopLevelWebViewRenderer = () => {
  const sourceUri = (Platform.OS === 'android' ? 'file:///android_asset/' : '') + 'Web.bundle/loader.html'
  const params = 'platform=' + Platform.OS
  const injectedJS = `if (!window.location.search) {
      var link = document.getElementById('web-bundle-progress-bar');
      link.href = './src/index.html?${params}';
      link.click();
    }`

  return (
    <WebView
      source={{ uri: sourceUri }}
      originWhitelist={['*']}
      onLoad={() => console.log('loaded in top level')}
      onError={(err) => console.log('error occurred', err)}
      onHttpError={() => console.log('http error occurred')}
      onMessage={(msg) => console.log('on message', msg)}
      javaScriptEnabled={true}
      allowFileAccess={true}
      injectedJavaScript={injectedJS}
    />
  )
}
