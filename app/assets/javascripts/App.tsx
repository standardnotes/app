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
  }
}

import { IsWebPlatform, WebAppVersion } from '@/Version'
import { Runtime, SNLog } from '@standardnotes/snjs'
import { render } from 'preact'
import { ApplicationGroupView } from './Components/ApplicationGroupView'
import { Bridge } from './Services/Bridge'
import { BrowserBridge } from './Services/BrowserBridge'
import { StartApplication } from './StartApplication'
import { ApplicationGroup } from './UIModels/ApplicationGroup'
import { isDev } from './Utils'

const startApplication: StartApplication = async function startApplication(
  defaultSyncServerHost: string,
  bridge: Bridge,
  enableUnfinishedFeatures: boolean,
  webSocketUrl: string,
) {
  SNLog.onLog = console.log
  SNLog.onError = console.error

  const mainApplicationGroup = new ApplicationGroup(
    defaultSyncServerHost,
    bridge,
    enableUnfinishedFeatures ? Runtime.Dev : Runtime.Prod,
    webSocketUrl,
  )

  if (isDev) {
    Object.defineProperties(window, {
      application: {
        get: () => mainApplicationGroup.primaryApplication,
      },
    })
  }

  const renderApp = () => {
    render(
      <ApplicationGroupView mainApplicationGroup={mainApplicationGroup} />,
      document.body.appendChild(document.createElement('div')),
    )
  }

  const domReady = document.readyState === 'complete' || document.readyState === 'interactive'
  if (domReady) {
    renderApp()
  } else {
    window.addEventListener('DOMContentLoaded', () => {
      renderApp()
    })
  }
}

if (IsWebPlatform) {
  startApplication(
    window.defaultSyncServer,
    new BrowserBridge(WebAppVersion),
    window.enabledUnfinishedFeatures,
    window.websocketUrl,
  ).catch(console.error)
} else {
  window.startApplication = startApplication
}
