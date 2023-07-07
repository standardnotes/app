import { runtime, action, browserAction, windows, storage, tabs } from 'webextension-polyfill'
import { ClipPayload, RuntimeMessage, RuntimeMessageTypes } from '../types/message'
import {
  ApplicationGroupEvent,
  ApplicationGroupEventData,
  DeinitMode,
  DeinitSource,
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
  confirm: async () => true,
  confirmV2: async () => true,
  alert: async () => {
    void 0
  },
  alertV2: async () => {
    void 0
  },
  blockingDialog: () => () => void 0,
  showErrorAlert: async () => {
    void 0
  },
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
        application.launch().catch(console.error)
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
        identifier: 'standardnotes',
        appVersion: '1.0.0',
        defaultHost: 'https://api.standardnotes.com',
      })
    },
  })
  .catch(console.error)

runtime.onSuspend.addListener(() => {
  if (application) {
    application.deinit(DeinitMode.Hard, DeinitSource.SwitchWorkspace)
    applicationGroup.deinit()
  }
})
