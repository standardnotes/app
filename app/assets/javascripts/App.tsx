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

    application?: WebApplication
    mainApplicationGroup?: ApplicationGroup
  }
}

import { IsWebPlatform, WebAppVersion } from '@/Version'
import { DesktopManagerInterface, SNLog } from '@standardnotes/snjs'
import { ApplicationGroupView } from './Components/ApplicationGroupView/ApplicationGroupView'
import { WebDevice } from './Device/WebDevice'
import { StartApplication } from './Device/StartApplication'
import { ApplicationGroup } from './UIModels/ApplicationGroup'
import { WebOrDesktopDevice } from './Device/WebOrDesktopDevice'
import { WebApplication } from './UIModels/Application'
import { createRoot } from 'react-dom/client'

let keyCount = 0
const getKey = () => {
  return keyCount++
}

const RootId = 'app-group-root'

const rootElement = document.createElement('div')
rootElement.id = RootId
const appendedRootNode = document.body.appendChild(rootElement)
const root = createRoot(appendedRootNode)

const startApplication: StartApplication = async function startApplication(
  defaultSyncServerHost: string,
  device: WebOrDesktopDevice,
  enableUnfinishedFeatures: boolean,
  webSocketUrl: string,
) {
  SNLog.onLog = console.log
  SNLog.onError = console.error

  const onDestroy = () => {
    const rootElement = document.getElementById(RootId) as HTMLElement
    root.unmount()
    rootElement.remove()
    renderApp()
  }

  const renderApp = () => {
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
  startApplication(
    window.defaultSyncServer,
    new WebDevice(WebAppVersion),
    window.enabledUnfinishedFeatures,
    window.websocketUrl,
  ).catch(console.error)
} else {
  window.startApplication = startApplication
}
