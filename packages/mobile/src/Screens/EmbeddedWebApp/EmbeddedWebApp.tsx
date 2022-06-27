import React from 'react'
import { MobileTopLevelWebViewRenderer } from '../../../MobileTopLevelWebViewRenderer'

/*
  Used suggestions from there sources:
  https://stackoverflow.com/questions/33506908/react-native-webview-load-from-device-local-file-system/62643381#62643381
  https://yelotofu.com/react-native-load-local-static-site-inside-webview-2b93eb1c4225
*/
export const EmbeddedWebApp = () => {
  /*
  const sourceUri = (Platform.OS === 'android' ? 'file:///android_asset/' : '') + 'Web.bundle/loader.html'
  const params = 'platform=' + Platform.OS
  const injectedJS = `if (!window.location.search) {
      var link = document.getElementById('web-bundle-progress-bar');
      link.href = './web-src/index.html?${params}';
      link.click();
    }`

  return (
    <WebView
      source={{ uri: sourceUri }}
      originWhitelist={['*']}
      onLoad={() => console.log('loaded')}
      onError={(err) => console.log('error occurred', err)}
      onHttpError={() => console.log('http error occurred')}
      onMessage={(msg) => console.log('on message', msg)}
      javaScriptEnabled={true}
      allowFileAccess={true}
      injectedJavaScript={injectedJS}
    />
  )*/

  /*
  // another approach
  return <WebView source={require('./WebRenderer-2.html')} originWhitelist={['*']} javaScriptEnabled={true} allowFileAccess={true} />
  */

  return <MobileTopLevelWebViewRenderer />
}
