import { ReactNativeToWebEvent } from '@standardnotes/snjs'
import { RefObject, useEffect } from 'react'
import { AppState, NativeModules, Platform } from 'react-native'
import { readFile } from 'react-native-fs'
import WebView from 'react-native-webview'

type ReceivedItem = {
  contentUri?: string | null
  fileName?: string | null
  mimeType?: string | null
  extension?: string | null
  text?: string | null
  weblink?: string | null
  subject?: string | null
}

const isReceivedFile = (item: ReceivedItem): item is ReceivedItem & { contentUri: string; mimeType: string } => {
  return !!item.contentUri && !!item.mimeType
}

const isReceivedWeblink = (item: ReceivedItem): item is ReceivedItem & { weblink: string } => {
  return !!item.weblink
}

const isReceivedText = (item: ReceivedItem): item is ReceivedItem & { text: string } => {
  return !!item.text
}

const { ReceiveSharingIntent } = NativeModules

export const useReceivedSharedItems = (webViewRef: RefObject<WebView<unknown>>) => {
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return
    }

    if (!ReceiveSharingIntent) {
      return
    }

    const eventListener = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        ReceiveSharingIntent.getFileNames().then(async (filesObject: Record<string, ReceivedItem>) => {
          try {
            const items = Object.values(filesObject)

            const receivedFiles = items.filter(isReceivedFile)
            const receivedLinks = items.filter(isReceivedWeblink)
            const receivedTexts = items.filter(isReceivedText)

            if (receivedFiles.length) {
              const filesWithData = await Promise.all(
                receivedFiles.map(async (file) => {
                  const data = await readFile(file.contentUri, 'base64')
                  return {
                    name: file.fileName || file.contentUri,
                    data,
                    mimeType: file.mimeType,
                  }
                }),
              )

              webViewRef.current?.postMessage(
                JSON.stringify({
                  reactNativeEvent: ReactNativeToWebEvent.ReceivedFiles,
                  messageType: 'event',
                  messageData: filesWithData,
                }),
              )
            }

            receivedLinks.forEach((item) => {
              webViewRef.current?.postMessage(
                JSON.stringify({
                  reactNativeEvent: ReactNativeToWebEvent.ReceivedText,
                  messageType: 'event',
                  messageData: {
                    title: item.subject || item.weblink,
                    text: item.weblink,
                  },
                }),
              )
            })

            receivedTexts.forEach((item) => {
              webViewRef.current?.postMessage(
                JSON.stringify({
                  reactNativeEvent: ReactNativeToWebEvent.ReceivedText,
                  messageType: 'event',
                  messageData: {
                    text: item.text,
                  },
                }),
              )
            })
          } catch (error) {
            console.error(error)
          }
        })
      }
    })

    return () => eventListener.remove()
  }, [webViewRef])
}
