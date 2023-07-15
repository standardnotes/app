import { ReactNativeToWebEvent } from '@standardnotes/snjs'
import { RefObject } from 'react'
import { AppState, Linking, NativeEventSubscription, NativeModules, Platform } from 'react-native'
import { readFile } from 'react-native-fs'
import WebView from 'react-native-webview'
const { ReceiveSharingIntent } = NativeModules

type ReceivedItem = {
  contentUri?: string | null
  fileName?: string | null
  mimeType?: string | null
  extension?: string | null
  text?: string | null
  weblink?: string | null
  subject?: string | null
  path?: string | null
}

type ReceivedAndroidFile = ReceivedItem & {
  contentUri: string
  mimeType: string
}

type ReceivedIosFile = ReceivedItem & {
  path: string
  mimeType: string
}

type ReceivedWeblink = ReceivedItem & {
  weblink: string
}

type ReceivedText = ReceivedItem & {
  text: string
}

const isReceivedAndroidFile = (item: ReceivedItem): item is ReceivedAndroidFile => {
  return !!item.contentUri && !!item.mimeType
}

const isReceivedIosFile = (item: ReceivedItem): item is ReceivedIosFile => {
  return !!item.path
}

const isReceivedWeblink = (item: ReceivedItem): item is ReceivedWeblink => {
  return !!item.weblink
}

const isReceivedText = (item: ReceivedItem): item is ReceivedText => {
  return !!item.text
}

const BundleIdentifier = 'com.standardnotes.standardnotes'
const IosUrlToCheckFor = `${BundleIdentifier}://dataUrl`

export class ReceivedSharedItemsHandler {
  private eventSub: NativeEventSubscription | null = null
  private receivedItemsQueue: ReceivedItem[] = []
  private isApplicationLaunched = false

  constructor(private webViewRef: RefObject<WebView>) {
    this.registerNativeEventSub()
  }

  setIsApplicationLaunched = (isApplicationLaunched: boolean) => {
    this.isApplicationLaunched = isApplicationLaunched

    if (isApplicationLaunched) {
      this.handleItemsQueue().catch(console.error)
    }
  }

  deinit() {
    this.receivedItemsQueue = []
    this.eventSub?.remove()
  }

  private registerNativeEventSub = () => {
    if (Platform.OS === 'ios') {
      Linking.getInitialURL()
        .then((url) => {
          if (url && url.startsWith(IosUrlToCheckFor)) {
            this.addSharedItemsToQueue(url)
          }
        })
        .catch(console.error)
      this.eventSub = Linking.addEventListener('url', ({ url }) => {
        if (url && url.startsWith(IosUrlToCheckFor)) {
          this.addSharedItemsToQueue(url)
        }
      })
      return
    }

    this.eventSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        this.addSharedItemsToQueue()
      }
    })
  }

  handleItemsQueue = async () => {
    if (!this.receivedItemsQueue.length) {
      return
    }

    const item = this.receivedItemsQueue.shift()
    if (!item) {
      return
    }

    if (isReceivedAndroidFile(item)) {
      const data = await readFile(item.contentUri, 'base64')
      const file = {
        name: item.fileName || item.contentUri,
        data,
        mimeType: item.mimeType,
      }
      this.webViewRef.current?.postMessage(
        JSON.stringify({
          reactNativeEvent: ReactNativeToWebEvent.ReceivedFile,
          messageType: 'event',
          messageData: file,
        }),
      )
    } else if (isReceivedIosFile(item)) {
      const data = await readFile(item.path, 'base64')
      const file = {
        name: item.fileName || item.path,
        data,
        mimeType: item.mimeType,
      }
      this.webViewRef.current?.postMessage(
        JSON.stringify({
          reactNativeEvent: ReactNativeToWebEvent.ReceivedFile,
          messageType: 'event',
          messageData: file,
        }),
      )
    } else if (isReceivedWeblink(item)) {
      this.webViewRef.current?.postMessage(
        JSON.stringify({
          reactNativeEvent: ReactNativeToWebEvent.ReceivedText,
          messageType: 'event',
          messageData: {
            title: item.subject || item.weblink,
            text: item.weblink,
          },
        }),
      )
    } else if (isReceivedText(item)) {
      this.webViewRef.current?.postMessage(
        JSON.stringify({
          reactNativeEvent: ReactNativeToWebEvent.ReceivedText,
          messageType: 'event',
          messageData: {
            text: item.text,
          },
        }),
      )
    }

    this.handleItemsQueue().catch(console.error)
  }

  private addSharedItemsToQueue = (url?: string) => {
    ReceiveSharingIntent.getFileNames(url)
      .then(async (received: unknown) => {
        if (!received) {
          return
        }

        if (Platform.OS === 'android') {
          const items = Object.values(received as Record<string, ReceivedItem>)
          this.receivedItemsQueue.push(...items)
        } else if (typeof received === 'string') {
          const parsed: unknown = JSON.parse(received)
          if (typeof parsed !== 'object') {
            return
          }
          if (!parsed) {
            return
          }
          if ('media' in parsed && Array.isArray(parsed.media)) {
            this.receivedItemsQueue.push(...parsed.media)
          }
          if ('text' in parsed && Array.isArray(parsed.text)) {
            this.receivedItemsQueue.push(
              ...parsed.text.map((text: string) => ({
                text: text,
              })),
            )
          }
          if ('urls' in parsed && Array.isArray(parsed.urls)) {
            this.receivedItemsQueue.push(
              ...parsed.urls.map((url: string) => ({
                weblink: url,
              })),
            )
          }
        }

        if (this.isApplicationLaunched) {
          this.handleItemsQueue().catch(console.error)
        }
      })
      .then(() => ReceiveSharingIntent.clearFileNames())
      .catch(console.error)
  }
}
