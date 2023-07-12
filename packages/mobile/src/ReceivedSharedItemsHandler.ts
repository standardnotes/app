import { ReactNativeToWebEvent } from '@standardnotes/snjs'
import { RefObject } from 'react'
import { AppState, NativeEventSubscription, NativeModules, Platform } from 'react-native'
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
}

type ReceivedFile = ReceivedItem & {
  contentUri: string
  mimeType: string
}

type ReceivedWeblink = ReceivedItem & {
  weblink: string
}

type ReceivedText = ReceivedItem & {
  text: string
}

const isReceivedFile = (item: ReceivedItem): item is ReceivedFile => {
  return !!item.contentUri && !!item.mimeType
}

const isReceivedWeblink = (item: ReceivedItem): item is ReceivedWeblink => {
  return !!item.weblink
}

const isReceivedText = (item: ReceivedItem): item is ReceivedText => {
  return !!item.text
}

export class ReceivedSharedItemsHandler {
  private appStateEventSub: NativeEventSubscription | null = null
  private receivedItemsQueue: ReceivedItem[] = []
  private isApplicationLaunched = false

  constructor(private webViewRef: RefObject<WebView>) {
    if (Platform.OS === 'android') {
      this.registerNativeEventSub()
    }
  }

  setIsApplicationLaunched = (isApplicationLaunched: boolean) => {
    this.isApplicationLaunched = isApplicationLaunched

    if (isApplicationLaunched) {
      this.handleItemsQueue().catch(console.error)
    }
  }

  deinit() {
    this.receivedItemsQueue = []
    this.appStateEventSub?.remove()
  }

  private registerNativeEventSub = () => {
    this.appStateEventSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        ReceiveSharingIntent.getFileNames()
          .then(async (filesObject: Record<string, ReceivedItem>) => {
            const items = Object.values(filesObject)
            this.receivedItemsQueue.push(...items)

            if (this.isApplicationLaunched) {
              this.handleItemsQueue().catch(console.error)
            }
          })
          .then(() => ReceiveSharingIntent.clearFileNames())
          .catch(console.error)
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

    if (isReceivedFile(item)) {
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
}
