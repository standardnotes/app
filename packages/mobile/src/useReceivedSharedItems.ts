import { useEffect, useState } from 'react'
import { AppState, NativeModules, Platform } from 'react-native'

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

const { ReceiveSharingIntent } = NativeModules

export const useReceivedSharedItems = () => {
  const [receivedFiles, setFiles] = useState<ReceivedFile[]>([])
  const [receivedLinks, setLinks] = useState<ReceivedWeblink[]>([])
  const [receivedTexts, setTexts] = useState<ReceivedText[]>([])

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

            setFiles(receivedFiles)
            setLinks(receivedLinks)
            setTexts(receivedTexts)
          } catch (error) {
            console.error(error)
          }
        })
      }
    })

    return () => eventListener.remove()
  }, [])

  return { receivedFiles, receivedLinks, receivedTexts }
}
