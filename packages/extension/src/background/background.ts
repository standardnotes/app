import { runtime, contextMenus, browserAction } from 'webextension-polyfill'
import { RuntimeMessage, RuntimeMessageTypes } from '../types/message'
import sendMessageToActiveTab from '../utils/sendMessageToActiveTab'

runtime.onInstalled.addListener(() => {
  contextMenus.create({
    id: 'sn-clip-selection',
    title: 'Clip selection to Standard Notes',
    contexts: ['selection'],
  })
})

const openPopupAndClipSelection = (content: string) => {
  browserAction.openPopup()
  setTimeout(() => {
    runtime.sendMessage({ type: RuntimeMessageTypes.ClipSelection, payload: content })
  }, 500)
}

runtime.onMessage.addListener((message: RuntimeMessage) => {
  if (message.type === RuntimeMessageTypes.ClipSelection) {
    if (!message.payload) {
      return
    }
    openPopupAndClipSelection(message.payload)
  }
})

contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === 'sn-clip-selection') {
    const selectionContent = await sendMessageToActiveTab(RuntimeMessageTypes.GetSelection)
    openPopupAndClipSelection(selectionContent)
  }
})
