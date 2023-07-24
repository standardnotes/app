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
    ReceiveSharingIntent.clearFileNames()
    this.receivedItemsQueue = []
    this.eventSub?.remove()
  }

  private registerNativeEventSub = () => {
    if (Platform.OS === 'ios') {
      Linking.getInitialURL()
        .then((url) => {
          if (url && url.startsWith(IosUrlToCheckFor)) {
            this.addSharedItemsToQueue(url).catch(console.error)
          }
        })
        .catch(console.error)
      this.eventSub = Linking.addEventListener('url', ({ url }) => {
        if (url && url.startsWith(IosUrlToCheckFor)) {
          this.addSharedItemsToQueue(url).catch(console.error)
        }
      })
      return
    }

    this.eventSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        this.addSharedItemsToQueue().catch(console.error)
      }
    })
  }

  handleItemsQueue = async () => {
    const item = this.receivedItemsQueue.shift()
    if (!item) {
      return
    }

    if (isReceivedAndroidFile(item) || isReceivedIosFile(item)) {
      await this.sendFileToWebView(item).catch(console.error)
    } else if (isReceivedWeblink(item)) {
      this.webViewRef.current?.postMessage(
        JSON.stringify({
          reactNativeEvent: ReactNativeToWebEvent.ReceivedLink,
          messageType: 'event',
          messageData: {
            title: item.subject || item.weblink,
            link: item.weblink,
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

    if (!this.receivedItemsQueue.length) {
      if (Platform.OS === 'ios') {
        ReceiveSharingIntent.clearFileNames()
      }

      return
    }

    this.handleItemsQueue().catch(console.error)
  }

  sendFileToWebView = async (item: ReceivedAndroidFile | ReceivedIosFile) => {
    const path = isReceivedAndroidFile(item) ? item.contentUri : item.path
    const data = await readFile(decodeURIComponent(path), 'base64')
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
  }

  private addSharedItemsToQueue = async (url?: string) => {
    const received =
      Platform.OS === 'ios' ? await ReceiveSharingIntent.getFileNames(url) : await ReceiveSharingIntent.getFileNames()

    // On iOS, we need to wait for the whole queue
    // to finish before clearing
    if (Platform.OS === 'android') {
      ReceiveSharingIntent.clearFileNames()
    }

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
  }
}
