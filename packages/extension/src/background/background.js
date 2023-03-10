import { runtime, contextMenus, browserAction, tabs } from 'webextension-polyfill'

runtime.onInstalled.addListener(() => {
  contextMenus.create({
    id: 'sn-clip-selection',
    title: 'Clip selection to Standard Notes',
    contexts: ['selection'],
  })
})

contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'sn-clip-selection') {
    tabs.sendMessage(tab.id, { type: 'get-selection' }).then((response) => {
      console.log(response)
    })
  }
})
