import { runtime, contextMenus, browserAction } from 'webextension-polyfill'

runtime.onInstalled.addListener(() => {
  contextMenus.create({
    id: 'sn-clip-selection',
    title: 'Clip selection to Standard Notes',
    contexts: ['selection'],
  })
})

contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'sn-clip-selection') {
    browserAction.openPopup()
  }
})
