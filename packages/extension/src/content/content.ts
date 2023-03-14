import { runtime } from 'webextension-polyfill'
import { Readability } from '@mozilla/readability'
import { RuntimeMessage, RuntimeMessageTypes } from '../types/message'

runtime.onMessage.addListener(async (message: RuntimeMessage) => {
  switch (message.type) {
    case RuntimeMessageTypes.HasSelection: {
      const selection = window.getSelection()

      if (!selection) {
        return false
      }

      if (selection.rangeCount < 1) {
        return false
      }

      const range = selection.getRangeAt(0)

      return !range.collapsed
    }
    case RuntimeMessageTypes.GetSelection: {
      const selection = window.getSelection()

      if (!selection || selection.rangeCount < 1) {
        return
      }

      const range = selection.getRangeAt(0)

      const result = document.createElement('div')
      result.appendChild(range.cloneContents())

      return result.innerHTML
    }
    case RuntimeMessageTypes.GetFullPage: {
      return document.body.innerHTML
    }
    case RuntimeMessageTypes.GetArticle: {
      const documentClone = document.cloneNode(true) as Document
      const article = new Readability(documentClone).parse()
      if (!article) {
        return
      }
      return article.content
    }
    default:
      return
  }
})
