import { runtime } from 'webextension-polyfill'

runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "get-selection": {
      const range = window.getSelection().getRangeAt(0)

      const result = document.createElement('div')
      result.appendChild(range.cloneContents())

      sendResponse(result.innerHTML)
      break
    }
    case "get-full-page": {
      sendResponse(document.body.innerHTML)
      break
    }
  }
})
