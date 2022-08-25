import { MobileDeviceInterface } from '@Lib/Interface'
import React, { useMemo, useRef } from 'react'
import { Platform } from 'react-native'
import { WebView, WebViewMessageEvent } from 'react-native-webview'

export const MobileWebAppContainer = () => {
  const sourceUri = (Platform.OS === 'android' ? 'file:///android_asset/' : '') + 'Web.bundle/src/index.html'
  const webViewRef = useRef<WebView>(null)

  const device = useMemo(() => new MobileDeviceInterface(), [])
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
      return this.sendMessage('${functionName}', args);
    }
    `
  }

  const WebProcessDeviceInterface = `
  class WebProcessDeviceInterface {
    constructor(messageSender) {
      this.appVersion = '1.2.3'
      // this.environment = 1
      this.environment = 4
      this.databases = []
      this.messageSender = messageSender
    }

    setApplication() {}

    sendMessage(functionName, args) {
      return this.messageSender.sendMessage(functionName, args)
    }

    ${stringFunctions}
  }
  `

  const WebProcessMessageSender = `
  class WebProcessMessageSender {
    constructor() {
      this.pendingMessages = []
      window.addEventListener('message', this.handleMessageFromReactNative.bind(this))
    }

    handleMessageFromReactNative(event) {
      const message = event.data
      try {
        const parsed = JSON.parse(message)
        const { messageId, returnValue } = parsed
        const pendingMessage = this.pendingMessages.find((m) => m.messageId === messageId)
        pendingMessage.resolve(returnValue)
        this.pendingMessages.splice(this.pendingMessages.indexOf(pendingMessage), 1)
      } catch (error) {
        console.log('Error parsing message from React Native', message, error)
      }
    }

    sendMessage(functionName, args) {
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

  true;
    `

  const onMessage = (event: WebViewMessageEvent) => {
    const message = event.nativeEvent.data
    try {
      const functionData = JSON.parse(message)
      void onFunctionMessage(functionData.functionName, functionData.messageId, functionData.args)
    } catch (error) {
      console.log('onGeneralMessage', JSON.stringify(message))
    }
  }

  const onFunctionMessage = async (functionName: string, messageId: string, args: any) => {
    const returnValue = await (device as any)[functionName](...args)
    console.log(`Native device function ${functionName} called`)
    webViewRef.current?.postMessage(JSON.stringify({ messageId, returnValue }))
  }

  /* eslint-disable @typescript-eslint/no-empty-function */
  return (
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
      injectedJavaScript={injectedJS}
    />
  )
  /* eslint-enable @typescript-eslint/no-empty-function */
}
