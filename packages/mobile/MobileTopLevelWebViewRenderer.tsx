import React from 'react'
import { Platform } from 'react-native'
import { WebView } from 'react-native-webview'

export const MobileTopLevelWebViewRenderer = () => {
  const sourceUri = (Platform.OS === 'android' ? 'file:///android_asset/' : '') + 'Web.bundle/loader.html'
  const params = 'platform=' + Platform.OS
  const injectedJS = `
    if (!window.location.search) {
      var link = document.getElementById('web-bundle-progress-bar');
      link.href = './src/index.html?${params}';
      link.click();
    }`

  /* eslint-disable @typescript-eslint/no-empty-function */
  return (
    <WebView
      source={{ uri: sourceUri }}
      originWhitelist={['*']}
      onLoad={() => {}}
      onError={(err) => console.error('An error has occurred', err)}
      onHttpError={() => console.error('An HTTP error occurred')}
      onMessage={() => {}}
      allowFileAccess={true}
      injectedJavaScript={injectedJS}
    />
  )
  /* eslint-enable @typescript-eslint/no-empty-function */
}
