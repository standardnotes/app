import { runtime, browserAction, windows } from 'webextension-polyfill'
import { RuntimeMessage, RuntimeMessageTypes } from '../types/message'

const isFirefox = navigator.userAgent.indexOf('Firefox/') !== -1

const openPopupAndClipSelection = async (payload: { title: string; content: string }) => {
  if (isFirefox) {
    const popupURL = (await browserAction.getPopup({})) + '&has_clip=true'
    await windows.create({
      type: 'detached_panel',
      url: popupURL,
      width: 300,
      height: 400,
    })
    setTimeout(() => runtime.sendMessage({ type: RuntimeMessageTypes.ClipSelection, payload }), 500)
    return
  }

  void browserAction.openPopup().then(() => {
    void runtime.sendMessage({ type: RuntimeMessageTypes.ClipSelection, payload })
  })
}

runtime.onMessage.addListener((message: RuntimeMessage) => {
  if (message.type === RuntimeMessageTypes.OpenPopupWithSelection) {
    if (!message.payload) {
      return
    }
    void openPopupAndClipSelection(message.payload)
  }
})
