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
import { render } from 'preact'
import { unmountComponentAtNode } from 'preact/compat'
import { ApplicationGroupView } from './Components/ApplicationGroupView'
import { WebDevice } from './Device/WebDevice'
import { StartApplication } from './Device/StartApplication'
import { ApplicationGroup } from './UIModels/ApplicationGroup'
import { WebOrDesktopDevice } from './Device/WebOrDesktopDevice'
import { WebApplication } from './UIModels/Application'

let keyCount = 0
const getKey = () => {
  return keyCount++
}

const RootId = 'app-group-root'

const startApplication: StartApplication = async function startApplication(
  defaultSyncServerHost: string,
  device: WebOrDesktopDevice,
  enableUnfinishedFeatures: boolean,
  webSocketUrl: string,
) {
  SNLog.onLog = console.log
  SNLog.onError = console.error

  const onDestroy = () => {
    const root = document.getElementById(RootId) as HTMLElement
    unmountComponentAtNode(root)
    root.remove()
    renderApp()
  }

  const renderApp = () => {
    const root = document.createElement('div')
    root.id = RootId

    const parentNode = document.body.appendChild(root)

    render(
      <ApplicationGroupView
        key={getKey()}
        server={defaultSyncServerHost}
        device={device}
        enableUnfinished={enableUnfinishedFeatures}
        websocketUrl={webSocketUrl}
        onDestroy={onDestroy}
      />,
      parentNode,
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
