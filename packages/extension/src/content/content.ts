import { runtime } from 'webextension-polyfill'
import { Readability } from '@mozilla/readability'

runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'get-selection': {
      const selection = window.getSelection()

      if (!selection) {
        sendResponse(new Error('No selection found'))
        return
      }

      const range = selection.getRangeAt(0)

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
      const documentClone = document.cloneNode(true) as Document
      const article = new Readability(documentClone).parse()
      if (!article) {
        sendResponse(new Error('Could not find article'))
        return
      }
      sendResponse(article.content)
      break
    }
  }
})
