import { runtime, action, browserAction, windows, storage, tabs } from 'webextension-polyfill'
import { ClipPayload, RuntimeMessage, RuntimeMessageTypes } from '../types/message'
import {
  ApplicationGroupEvent,
  ApplicationGroupEventData,
  ClientDisplayableError,
  ContentType,
  Environment,
  Platform,
  SNApplication,
  SNApplicationGroup,
  SNLog,
} from '@standardnotes/snjs'
import { ExtensionDevice } from '../device/device'
import { SNWebCrypto } from '@standardnotes/sncrypto-web'

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
  }
})

const device = new ExtensionDevice('1.0.0')
const crypto = new SNWebCrypto()
const alertService = {
  confirm: async (message: string) => confirm(message),
  confirmV2: async ({ text }: { text: string }) => confirm(text),
  alert: async (message: string) => alert(message),
  alertV2: async ({ text }: { text: string }) => alert(text),
  blockingDialog: (text: string) => () => alert(text),
  showErrorAlert: async (error: ClientDisplayableError) => alert(error.text),
}

// eslint-disable-next-line no-console
SNLog.onLog = console.log
SNLog.onError = console.error
global.window = self

let application: SNApplication
const applicationGroup = new SNApplicationGroup(device)

applicationGroup.addEventObserver(async (event, data) => {
  if (event === ApplicationGroupEvent.PrimaryApplicationSet) {
    const castData = data as ApplicationGroupEventData[ApplicationGroupEvent.PrimaryApplicationSet]

    application = castData.application as SNApplication

    device.setApplication(application)

    application
      .prepareForLaunch({
        receiveChallenge(challenge) {
          return Promise.resolve(challenge)
        },
      })
      .then(() => {
        application
          .launch()
          .then(() => {
            application.addEventObserver(async (event) => {
              console.log(event, application.items.getItems(ContentType.TYPES.Note))
            })
            application.streamItems(ContentType.TYPES.Note, ({ changed, inserted, removed }) => {
              console.log('changed', changed)
              console.log('inserted', inserted)
              console.log('removed', removed)
            })
          })
          .catch(console.error)
      })
      .catch(console.error)
  }
})

applicationGroup
  .initialize({
    async applicationCreator(descriptor, deviceInterface) {
      return new SNApplication({
        environment: Environment.Web,
        platform: Platform.LinuxWeb,
        deviceInterface,
        crypto,
        alertService,
        identifier: descriptor.identifier,
        appVersion: '1.0.0',
        defaultHost: 'https://api.standardnotes.com',
      })
    },
  })
  .catch(console.error)
