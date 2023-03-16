import { runtime, browserAction, windows } from 'webextension-polyfill'
import { RuntimeMessage, RuntimeMessageTypes } from '../types/message'

const isFirefox = navigator.userAgent.indexOf('Firefox/') !== -1

const openPopupAndClipSelection = async (content: string) => {
  if (isFirefox) {
    const popupURL = (await browserAction.getPopup({})) + '&has_clip=true'
    await windows.create({
      type: 'detached_panel',
      url: popupURL,
      width: 300,
      height: 400,
    })
    setTimeout(() => runtime.sendMessage({ type: RuntimeMessageTypes.ClipSelection, payload: content }), 500)
    return
  }

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
