import { MobileDevice, MobileDeviceEvent } from '@Lib/Interface'
import { IsDev } from '@Lib/Utils'
import { ReactNativeToWebEvent } from '@standardnotes/snjs'
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Platform, SafeAreaView } from 'react-native'
import { WebView, WebViewMessageEvent } from 'react-native-webview'
import { ThemeContext } from 'styled-components'
import styled from 'styled-components/native'
import { AppStateObserverService } from './AppStateObserverService'

const LoggingEnabled = IsDev

const StyledSafeAreaView = styled(SafeAreaView)`
  flex: 1;
  ${(props) => `background-color: ${props.theme.stylekitBackgroundColor}`}
`

export const MobileWebAppContainer = () => {
  const [identifier, setIdentifier] = useState(Math.random())

  const destroyAndReload = useCallback(() => {
    setIdentifier(Math.random())
  }, [])

  return <MobileWebAppContents key={`${identifier}`} destroyAndReload={destroyAndReload} />
}

const MobileWebAppContents = ({ destroyAndReload }: { destroyAndReload: () => void }) => {
  const theme = useContext(ThemeContext)
  const webViewRef = useRef<WebView>(null)
  const sourceUri = (Platform.OS === 'android' ? 'file:///android_asset/' : '') + 'Web.bundle/src/index.html'
  const stateService = useMemo(() => new AppStateObserverService(), [])
  const device = useMemo(() => new MobileDevice(stateService), [stateService])

  useEffect(() => {
    const removeListener = stateService.addEventObserver((event: ReactNativeToWebEvent) => {
      webViewRef.current?.postMessage(JSON.stringify({ reactNativeEvent: event, messageType: 'event' }))
    })

    return () => {
      removeListener()
    }
  }, [webViewRef, stateService])

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
      this.appVersion = '1.2.3'
      this.environment = 4
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

  /* eslint-disable @typescript-eslint/no-empty-function */
  return (
    <StyledSafeAreaView theme={theme}>
      <WebView
        ref={webViewRef}
        source={{ uri: sourceUri }}
        originWhitelist={['*']}
        onLoad={() => {}}
        onError={(err) => console.error('An error has occurred', err)}
        onHttpError={() => console.error('An HTTP error occurred')}
        onMessage={onMessage}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        injectedJavaScriptBeforeContentLoaded={injectedJS}
      />
    </StyledSafeAreaView>
  )
  /* eslint-enable @typescript-eslint/no-empty-function */
}
