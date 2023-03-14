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
  browserAction.openPopup().then(() => {
    runtime.sendMessage({ type: RuntimeMessageTypes.ClipSelection, payload: content })
  })
}

runtime.onMessage.addListener((message: RuntimeMessage) => {
  if (message.type === RuntimeMessageTypes.OpenPopupWithSelection) {
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
