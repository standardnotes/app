import { ReactNativeToWebEvent } from '@standardnotes/snjs'
import { ColorSchemeObserverService } from './ColorSchemeObserverService'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Keyboard, Platform } from 'react-native'
import VersionInfo from 'react-native-version-info'
import { WebView, WebViewMessageEvent } from 'react-native-webview'
import { OnShouldStartLoadWithRequest } from 'react-native-webview/lib/WebViewTypes'
import pjson from '../package.json'
import { AndroidBackHandlerService } from './AndroidBackHandlerService'
import { AppStateObserverService } from './AppStateObserverService'
import { MobileDevice, MobileDeviceEvent } from './Lib/Interface'
import { IsDev } from './Lib/Utils'

const LoggingEnabled = IsDev

export const MobileWebAppContainer = () => {
  const [identifier, setIdentifier] = useState(Math.random())

  const destroyAndReload = useCallback(() => {
    setIdentifier(Math.random())
  }, [])

  return <MobileWebAppContents key={`${identifier}`} destroyAndReload={destroyAndReload} />
}

const MobileWebAppContents = ({ destroyAndReload }: { destroyAndReload: () => void }) => {
  const webViewRef = useRef<WebView>(null)

  const sourceUri = (Platform.OS === 'android' ? 'file:///android_asset/' : '') + 'Web.bundle/src/index.html'
  const stateService = useMemo(() => new AppStateObserverService(), [])
  const androidBackHandlerService = useMemo(() => new AndroidBackHandlerService(), [])
  const colorSchemeService = useMemo(() => new ColorSchemeObserverService(), [])
  const device = useMemo(
    () => new MobileDevice(stateService, androidBackHandlerService, colorSchemeService),
    [androidBackHandlerService, colorSchemeService, stateService],
  )

  useEffect(() => {
    const removeStateServiceListener = stateService.addEventObserver((event: ReactNativeToWebEvent) => {
      webViewRef.current?.postMessage(JSON.stringify({ reactNativeEvent: event, messageType: 'event' }))
    })

    const removeBackHandlerServiceListener = androidBackHandlerService.addEventObserver(
      (event: ReactNativeToWebEvent) => {
        webViewRef.current?.postMessage(JSON.stringify({ reactNativeEvent: event, messageType: 'event' }))
      },
    )

    const removeColorSchemeServiceListener = colorSchemeService.addEventObserver((event: ReactNativeToWebEvent) => {
      webViewRef.current?.postMessage(JSON.stringify({ reactNativeEvent: event, messageType: 'event' }))
    })

    const keyboardShowListener = Keyboard.addListener('keyboardWillShow', () => {
      device.reloadStatusBarStyle(false)
    })

    const keyboardHideListener = Keyboard.addListener('keyboardDidHide', () => {
      device.reloadStatusBarStyle(false)
    })

    const keyboardWillChangeFrame = Keyboard.addListener('keyboardWillChangeFrame', (e) => {
      webViewRef.current?.postMessage(
        JSON.stringify({
          reactNativeEvent: ReactNativeToWebEvent.KeyboardFrameWillChange,
          messageType: 'event',
          messageData: { height: e.endCoordinates.height, contentHeight: e.endCoordinates.screenY },
        }),
      )
    })

    return () => {
      removeStateServiceListener()
      removeBackHandlerServiceListener()
      removeColorSchemeServiceListener()
      keyboardShowListener.remove()
      keyboardHideListener.remove()
      keyboardWillChangeFrame.remove()
    }
  }, [webViewRef, stateService, device, androidBackHandlerService, colorSchemeService])

  useEffect(() => {
    const observer = device.addMobileWebEventReceiver((event) => {
      if (event === MobileDeviceEvent.RequestsWebViewReload) {
        destroyAndReload()
      }
    })

    return () => {
      observer()
    }
  }, [device, destroyAndReload])

  const functions = Object.getOwnPropertyNames(Object.getPrototypeOf(device))

  const baselineFunctions: Record<string, any> = {
    isDeviceDestroyed: `(){
      return false
    }`,
  }

  let stringFunctions = ''
  for (const [key, value] of Object.entries(baselineFunctions)) {
    stringFunctions += `${key}${value}`
  }

  for (const functionName of functions) {
    if (functionName === 'constructor' || baselineFunctions[functionName]) {
      continue
    }

    stringFunctions += `
    ${functionName}(...args) {
      return this.askReactNativeToInvokeInterfaceMethod('${functionName}', args);
    }
    `
  }

  const WebProcessDeviceInterface = `
  class WebProcessDeviceInterface {
    constructor(messageSender) {
      this.appVersion = '${pjson.version} (${VersionInfo.buildVersion})'
      this.environment = 3
      this.platform = ${device.platform}
      this.databases = []
      this.messageSender = messageSender
    }

    setApplication() {}

    askReactNativeToInvokeInterfaceMethod(functionName, args) {
      return this.messageSender.askReactNativeToInvokeInterfaceMethod(functionName, args)
    }

    ${stringFunctions}
  }
  `

  const WebProcessMessageSender = `
  class WebProcessMessageSender {
    constructor() {
      this.pendingMessages = []
    }

    handleReplyFromReactNative( messageId, returnValue) {
      const pendingMessage = this.pendingMessages.find((m) => m.messageId === messageId)
      pendingMessage.resolve(returnValue)
      this.pendingMessages.splice(this.pendingMessages.indexOf(pendingMessage), 1)
    }

    askReactNativeToInvokeInterfaceMethod(functionName, args) {
      const messageId = Math.random()
      window.ReactNativeWebView.postMessage(JSON.stringify({ functionName: functionName, args: args, messageId }))

      return new Promise((resolve) => {
        this.pendingMessages.push({
          messageId,
          resolve,
        })
      })
    }
  }
  `

  const injectedJS = `

  console.log = (...args) => {
    window.ReactNativeWebView.postMessage('[web log] ' + args.join(' '));
  }

  ${WebProcessDeviceInterface}
  ${WebProcessMessageSender}

  const messageSender = new WebProcessMessageSender();
  window.reactNativeDevice = new WebProcessDeviceInterface(messageSender);

  const handleMessageFromReactNative = (event) => {
    const message = event.data

    try {
      const parsed = JSON.parse(message)
      const { messageId, returnValue, messageType } = parsed

      if (messageType === 'reply') {
        messageSender.handleReplyFromReactNative(messageId, returnValue)
      }

    } catch (error) {
      console.log('Error parsing message from React Native', message, error)
    }
  }

  window.addEventListener('message', handleMessageFromReactNative)
  document.addEventListener('message', handleMessageFromReactNative)

  true;
    `

  const onMessage = (event: WebViewMessageEvent) => {
    const message = event.nativeEvent.data
    try {
      const functionData = JSON.parse(message)
      void onFunctionMessage(functionData.functionName, functionData.messageId, functionData.args)
    } catch (error) {
      if (LoggingEnabled) {
        console.log('onGeneralMessage', JSON.stringify(message))
      }
    }
  }

  const onFunctionMessage = async (functionName: string, messageId: string, args: any) => {
    const returnValue = await (device as any)[functionName](...args)
    if (LoggingEnabled) {
      console.log(`Native device function ${functionName} called`)
    }
    webViewRef.current?.postMessage(JSON.stringify({ messageId, returnValue, messageType: 'reply' }))
  }

  const onShouldStartLoadWithRequest: OnShouldStartLoadWithRequest = (request) => {
    /**
     * We want to handle link clicks within an editor by opening the browser
     * instead of loading inline. On iOS, onShouldStartLoadWithRequest is
     * called for all requests including the initial request to load the editor.
     * On iOS, clicks in the editors have a navigationType of 'click', but on
     * Android, this is not the case (no navigationType).
     * However, on Android, this function is not called for the initial request.
     * So that might be one way to determine if this request is a click or the
     * actual editor load request. But I don't think it's safe to rely on this
     * being the case in the future. So on Android, we'll handle url loads only
     * if the url isn't equal to the editor url.
     */

    const shouldStopRequest =
      (Platform.OS === 'ios' && request.navigationType === 'click') ||
      (Platform.OS === 'android' && request.url !== sourceUri)

    const isComponentUrl = device.isUrlComponentUrl(request.url)

    if (shouldStopRequest && !isComponentUrl) {
      device.openUrl(request.url)
      return false
    }

    return true
  }

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: sourceUri }}
      style={{ backgroundColor: 'black' }}
      originWhitelist={['*']}
      onError={(err) => console.error('An error has occurred', err)}
      onHttpError={() => console.error('An HTTP error occurred')}
      onMessage={onMessage}
      onContentProcessDidTerminate={() => {
        webViewRef.current?.reload()
      }}
      onRenderProcessGone={() => {
        webViewRef.current?.reload()
      }}
      onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
      allowFileAccess={true}
      allowUniversalAccessFromFileURLs={true}
      injectedJavaScriptBeforeContentLoaded={injectedJS}
      bounces={false}
      keyboardDisplayRequiresUserAction={false}
      scalesPageToFit={true}
      /**
       * This disables the global window scroll but keeps scroll within div elements like lists and textareas.
       * This is needed to prevent the keyboard from pushing the webview up and down when it appears and disappears.
       */
      scrollEnabled={false}
    />
  )
}
