'use strict'

declare global {
  interface Window {
    dashboardUrl?: string
    defaultSyncServer: string
    devAccountEmail?: string
    devAccountPassword?: string
    devAccountServer?: string
    enabledUnfinishedFeatures: boolean
    plansUrl?: string
    purchaseUrl?: string
    startApplication?: StartApplication
    websocketUrl: string
    electronAppVersion?: string
    webClient?: DesktopManagerInterface
    electronRemoteBridge?: unknown
    reactNativeDevice?: WebDevice

    application?: WebApplication
    mainApplicationGroup?: ApplicationGroup
    MSStream?: unknown
  }
}

import { disableIosTextFieldZoom } from '@/Utils'
import { IsWebPlatform, WebAppVersion } from '@/Constants/Version'
import { DesktopManagerInterface, SNLog } from '@standardnotes/snjs'
import ApplicationGroupView from './Components/ApplicationGroupView/ApplicationGroupView'
import { WebDevice } from './Application/Device/WebDevice'
import { StartApplication } from './Application/Device/StartApplication'
import { ApplicationGroup } from './Application/ApplicationGroup'
import { WebOrDesktopDevice } from './Application/Device/WebOrDesktopDevice'
import { WebApplication } from './Application/Application'
import { createRoot, Root } from 'react-dom/client'
import { ElementIds } from './Constants/ElementIDs'
import { setDefaultMonospaceFont } from './setDefaultMonospaceFont'

let keyCount = 0
const getKey = () => {
  return keyCount++
}

const startApplication: StartApplication = async function startApplication(
  defaultSyncServerHost: string,
  device: WebOrDesktopDevice,
  enableUnfinishedFeatures: boolean,
  webSocketUrl: string,
) {
  // eslint-disable-next-line no-console
  SNLog.onLog = console.log
  SNLog.onError = console.error
  let root: Root

  const onDestroy = () => {
    const rootElement = document.getElementById(ElementIds.RootId) as HTMLElement
    root.unmount()
    rootElement.remove()
    renderApp()
  }

  const renderApp = () => {
    const rootElement = document.createElement('div')
    rootElement.id = ElementIds.RootId
    rootElement.className = 'h-full'
    const appendedRootNode = document.body.appendChild(rootElement)
    root = createRoot(appendedRootNode)

    disableIosTextFieldZoom()

    setDefaultMonospaceFont(device.platform)

    root.render(
      <ApplicationGroupView
        key={getKey()}
        server={defaultSyncServerHost}
        device={device}
        enableUnfinished={enableUnfinishedFeatures}
        websocketUrl={webSocketUrl}
        onDestroy={onDestroy}
      />,
    )
  }

  const domReady = document.readyState === 'complete' || document.readyState === 'interactive'

  if (domReady) {
    renderApp()
  } else {
    window.addEventListener('DOMContentLoaded', function callback() {
      renderApp()

      window.removeEventListener('DOMContentLoaded', callback)
    })
  }
}

if (IsWebPlatform) {
  const ReactNativeWebViewInitializationTimeout = 0

  setTimeout(() => {
    const device = window.reactNativeDevice || new WebDevice(WebAppVersion)

    startApplication(window.defaultSyncServer, device, window.enabledUnfinishedFeatures, window.websocketUrl).catch(
      console.error,
    )
  }, ReactNativeWebViewInitializationTimeout)
} else {
  window.startApplication = startApplication
}
