import { runtime, contextMenus, browserAction } from 'webextension-polyfill'
import { RuntimeMessage, RuntimeMessageTypes } from '../types/message'
import sendMessageToActiveTab from '../utils/sendMessageToActiveTab'

const ClipSelectionContextMenuId = 'sn-clip-selection' as const

runtime.onInstalled.addListener(() => {
  contextMenus.create({
    id: ClipSelectionContextMenuId,
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
