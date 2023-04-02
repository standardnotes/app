import { runtime } from 'webextension-polyfill'
import { Readability } from '@mozilla/readability'
import { RuntimeMessage, RuntimeMessageTypes } from '../types/message'

let isSelectingNodeForClipping = false

runtime.onMessage.addListener(async (message: RuntimeMessage) => {
  switch (message.type) {
    case RuntimeMessageTypes.StartNodeSelection: {
      isSelectingNodeForClipping = true
      return
    }
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

      return { title: document.title, content: result.innerHTML, url: window.location.href }
    }
    case RuntimeMessageTypes.GetFullPage: {
      return { title: document.title, content: document.body.innerHTML, url: window.location.href }
    }
    case RuntimeMessageTypes.GetArticle: {
      const documentClone = document.cloneNode(true) as Document
      const article = new Readability(documentClone).parse()
      if (!article) {
        return
      }
      return { title: article.title, content: article.content, url: window.location.href }
    }
    default:
      return
  }
})

const nodeOverlayElement = document.createElement('div')
nodeOverlayElement.style.border = '2px solid #086dd6'
nodeOverlayElement.style.position = 'fixed'
nodeOverlayElement.style.top = '0'
nodeOverlayElement.style.left = '0'
nodeOverlayElement.style.zIndex = '69420'
nodeOverlayElement.style.width = window.innerWidth + 'px'
nodeOverlayElement.style.height = window.innerHeight - 4 + 'px'
nodeOverlayElement.style.pointerEvents = 'none'
nodeOverlayElement.style.visibility = 'hidden'
nodeOverlayElement.id = 'sn-clipper-node-overlay'

document.body.appendChild(nodeOverlayElement)

window.addEventListener('mousemove', (event) => {
  if (!isSelectingNodeForClipping) {
    nodeOverlayElement.style.visibility = 'hidden'
    return
  }
  nodeOverlayElement.style.visibility = ''
  const { target } = event
  if (!target || !(target instanceof HTMLElement)) {
    return
  }
  const targetRect = target.getBoundingClientRect()
  nodeOverlayElement.style.width = targetRect.width + 'px'
  nodeOverlayElement.style.height = targetRect.height + 'px'
  nodeOverlayElement.style.transform = `translate3d(${targetRect.x}px, ${targetRect.y}px, 0)`
})

const disableNodeSelection = () => {
  isSelectingNodeForClipping = false
  nodeOverlayElement.style.visibility = 'hidden'
}

window.addEventListener('click', (event) => {
  if (!isSelectingNodeForClipping) {
    return
  }
  disableNodeSelection()
  event.preventDefault()
  event.stopPropagation()
  const { target } = event
  if (!target || !(target instanceof HTMLElement)) {
    return
  }
  const title = document.title
  const content = target.outerHTML
  void runtime.sendMessage({
    type: RuntimeMessageTypes.OpenPopupWithSelection,
    payload: { title, content, url: window.location.href },
  } as RuntimeMessage)
})

window.addEventListener('keydown', (event) => {
  if (!isSelectingNodeForClipping) {
    return
  }
  if (event.key === 'Escape') {
    disableNodeSelection()
  }
})
