import { runtime } from 'webextension-polyfill'

runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'get-selection') {
    const range = window.getSelection().getRangeAt(0)

    const result = document.createElement('div')
    result.appendChild(range.cloneContents())

    sendResponse(result.innerHTML)
  }
})
