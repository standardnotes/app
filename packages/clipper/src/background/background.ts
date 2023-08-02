import { runtime, action, browserAction, windows, storage, tabs } from 'webextension-polyfill'
import { ClipPayload, RuntimeMessage, RuntimeMessageTypes } from '../types/message'
import { Environment, FetchRequestHandler, Logger, SnjsVersion } from '@standardnotes/snjs'
import packageInfo from '../../package.json'

const isFirefox = navigator.userAgent.indexOf('Firefox/') !== -1

const openPopupAndClipSelection = async (payload: ClipPayload) => {
  await storage.local.set({ clip: payload })

  if (isFirefox) {
    const popupURL = await browserAction.getPopup({})
    await windows.create({
      type: 'detached_panel',
      url: popupURL,
      width: 350,
      height: 450,
    })
    return
  }

  const openPopup = runtime.getManifest().manifest_version === 3 ? action.openPopup : browserAction.openPopup

  void openPopup()
}

const logger = new Logger('clipper')
const requestHandler = new FetchRequestHandler(SnjsVersion, packageInfo.version, Environment.Clipper, logger)

runtime.onMessage.addListener(async (message: RuntimeMessage) => {
  if (message.type === RuntimeMessageTypes.OpenPopupWithSelection) {
    if (!message.payload) {
      return
    }
    void openPopupAndClipSelection(message.payload)
  } else if (message.type === RuntimeMessageTypes.CaptureVisibleTab) {
    return await tabs.captureVisibleTab(undefined, {
      format: 'png',
    })
  } else if (message.type === RuntimeMessageTypes.RunHttpRequest) {
    requestHandler.handleRequest(message.payload).catch(console.error)
  }
})
