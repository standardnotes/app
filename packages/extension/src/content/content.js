import { runtime } from 'webextension-polyfill'
import { Readability } from '@mozilla/readability'

runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'get-selection': {
      const range = window.getSelection().getRangeAt(0)

      const result = document.createElement('div')
      result.appendChild(range.cloneContents())

      sendResponse(result.innerHTML)
      break
    }
    case 'get-full-page': {
      sendResponse(document.body.innerHTML)
      break
    }
    case 'get-article': {
      const documentClone = document.cloneNode(true)
      const article = new Readability(documentClone).parse()
      sendResponse(article.content)
      break
    }
  }
})
