/* eslint-disable @typescript-eslint/no-explicit-any */

import { ApplicationEvent, ReactNativeToWebEvent } from '@standardnotes/snjs'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Dimensions, Keyboard, Platform, Text, View } from 'react-native'
import VersionInfo from 'react-native-version-info'
import { WebView, WebViewMessageEvent } from 'react-native-webview'
import { OnShouldStartLoadWithRequest, WebViewNativeConfig } from 'react-native-webview/lib/WebViewTypes'
import { AndroidBackHandlerService } from './AndroidBackHandlerService'
import { AppStateObserverService } from './AppStateObserverService'
import { ColorSchemeObserverService } from './ColorSchemeObserverService'
import CustomAndroidWebView from './CustomAndroidWebView'
import { MobileDevice, MobileDeviceEvent } from './Lib/MobileDevice'
import { IsDev } from './Lib/Utils'
import { ReceivedSharedItemsHandler } from './ReceivedSharedItemsHandler'
import { ReviewService } from './ReviewService'
import notifee, { EventType } from '@notifee/react-native'

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
  const _reviewService = useRef(new ReviewService(device))

  const [showAndroidWebviewUpdatePrompt, setShowAndroidWebviewUpdatePrompt] = useState(false)

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
      webViewRef.current?.postMessage(
        JSON.stringify({
          reactNativeEvent: ReactNativeToWebEvent.KeyboardWillShow,
          messageType: 'event',
        }),
      )
    })

    const keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', () => {
      device.reloadStatusBarStyle(false)
      webViewRef.current?.postMessage(
        JSON.stringify({
          reactNativeEvent: ReactNativeToWebEvent.KeyboardWillHide,
          messageType: 'event',
        }),
      )
    })

    const keyboardHideListener = Keyboard.addListener('keyboardDidHide', () => {
      device.reloadStatusBarStyle(false)
    })

    const keyboardWillChangeFrame = Keyboard.addListener('keyboardWillChangeFrame', (e) => {
      webViewRef.current?.postMessage(
        JSON.stringify({
          reactNativeEvent: ReactNativeToWebEvent.KeyboardFrameWillChange,
          messageType: 'event',
          messageData: {
            height: e.endCoordinates.height,
            contentHeight: e.endCoordinates.screenY,
            isFloatingKeyboard: e.endCoordinates.width !== Dimensions.get('window').width,
          },
        }),
      )
    })

    const keyboardDidChangeFrame = Keyboard.addListener('keyboardDidChangeFrame', (e) => {
      webViewRef.current?.postMessage(
        JSON.stringify({
          reactNativeEvent: ReactNativeToWebEvent.KeyboardFrameDidChange,
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
      keyboardDidChangeFrame.remove()
      keyboardWillHideListener.remove()
    }
  }, [webViewRef, stateService, device, androidBackHandlerService, colorSchemeService])

  useEffect(() => {
    return notifee.onForegroundEvent(({ type, detail }) => {
      if (type !== EventType.ACTION_PRESS) {
        return
      }

      const { notification, pressAction } = detail

      if (!notification || !pressAction) {
        return
      }

      if (pressAction.id !== 'open-file') {
        return
      }

      webViewRef.current?.postMessage(
        JSON.stringify({
          reactNativeEvent: ReactNativeToWebEvent.OpenFilePreview,
          messageType: 'event',
          messageData: {
            id: notification.id,
          },
        }),
      )
    })
  }, [])

  useEffect(() => {
    const observer = device.addMobileDeviceEventReceiver((event) => {
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
      this.appVersion = '${VersionInfo.appVersion} (${VersionInfo.buildVersion})'
      this.environment = 3
      this.platform = ${device.platform}
      this.databases = []
      this.messageSender = messageSender
    }

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

  console.error = (...args) => {
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
    if (message === 'appLoadError' && Platform.OS === 'android') {
      setShowAndroidWebviewUpdatePrompt(true)
      return
    }
    if (message === 'appLoaded') {
      setDidLoadEnd(true)
      return
    }
    try {
      const functionData = JSON.parse(message)
      void onFunctionMessage(functionData.functionName, functionData.messageId, functionData.args)
    } catch (error) {
      if (LoggingEnabled) {
        // eslint-disable-next-line no-console
        console.log('onGeneralMessage', JSON.stringify(message))
      }
    }
  }

  const onFunctionMessage = async (functionName: string, messageId: string, args: any) => {
    const returnValue = await (device as any)[functionName](...args)
    if (LoggingEnabled && functionName !== 'consoleLog') {
      // eslint-disable-next-line no-console
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

    const isComponentUrl = device.isUrlRegisteredComponentUrl(request.url)

    if (shouldStopRequest && !isComponentUrl) {
      device.openUrl(request.url)
      return false
    }

    return true
  }

  const requireInlineMediaPlaybackForMomentsFeature = true
  const requireMediaUserInteractionForMomentsFeature = false

  const receivedSharedItemsHandler = useRef(new ReceivedSharedItemsHandler(webViewRef))
  useEffect(() => {
    const receivedSharedItemsHandlerInstance = receivedSharedItemsHandler.current
    return () => {
      receivedSharedItemsHandlerInstance.deinit()
    }
  }, [])
  useEffect(() => {
    return device.addApplicationEventReceiver((event) => {
      if (event === ApplicationEvent.Launched) {
        receivedSharedItemsHandler.current.setIsApplicationLaunched(true)
      }
    })
  }, [device])

  const [didLoadEnd, setDidLoadEnd] = useState(false)

  if (showAndroidWebviewUpdatePrompt) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'black',
        }}
      >
        <Text
          style={{
            color: 'white',
            fontSize: 20,
            fontWeight: 'bold',
            marginBottom: 20,
          }}
        >
          Could not load app
        </Text>
        <Text
          style={{
            color: 'white',
            fontSize: 16,
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          Please make sure your Android System Webview is updated to the latest version
        </Text>
        <Button
          title={'Update'}
          onPress={() => {
            setShowAndroidWebviewUpdatePrompt(false)
            device.openUrl('https://play.google.com/store/apps/details?id=com.google.android.webview')
          }}
        />
      </View>
    )
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#000000',
      }}
    >
      <WebView
        ref={webViewRef}
        source={{ uri: sourceUri }}
        style={{
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#000000',
          opacity: didLoadEnd ? 1 : 0,
        }}
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
        hideKeyboardAccessoryView={true}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        injectedJavaScriptBeforeContentLoaded={injectedJS}
        bounces={false}
        keyboardDisplayRequiresUserAction={false}
        allowsInlineMediaPlayback={requireInlineMediaPlaybackForMomentsFeature}
        mediaPlaybackRequiresUserAction={requireMediaUserInteractionForMomentsFeature}
        scalesPageToFit={true}
        /**
         * This disables the global window scroll but keeps scroll within div elements like lists and textareas.
         * This is needed to prevent the keyboard from pushing the webview up and down when it appears and disappears.
         */
        scrollEnabled={false}
        overScrollMode="never"
        nativeConfig={Platform.select({
          android: {
            component: CustomAndroidWebView,
          } as WebViewNativeConfig,
        })}
        webviewDebuggingEnabled
      />
    </View>
  )
}
