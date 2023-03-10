import { runtime, contextMenus, browserAction, tabs } from 'webextension-polyfill'
import getSelectionHTML from '../utils/getSelectionHTML'

runtime.onInstalled.addListener(() => {
  contextMenus.create({
    id: 'sn-clip-selection',
    title: 'Clip selection to Standard Notes',
    contexts: ['selection'],
  })
})

contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'sn-clip-selection') {
    const selectionContent = await getSelectionHTML()
    browserAction.openPopup()
    setTimeout(() => {
      runtime.sendMessage({ type: 'clip-selection', payload: selectionContent })
    }, 500)
  }
})
