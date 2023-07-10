import { requireNativeComponent } from 'react-native'
import { NativeWebViewAndroid } from 'react-native-webview/lib/WebViewTypes'

export default requireNativeComponent('CustomWebView') as NativeWebViewAndroid
