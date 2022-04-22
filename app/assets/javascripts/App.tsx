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
import { WebDevice } from './Device/WebDevice'
import { StartApplication } from './Device/StartApplication'
import { ApplicationGroup } from './UIModels/ApplicationGroup'
import { isDev } from './Utils'
import { WebOrDesktopDevice } from './Device/WebOrDesktopDevice'

const startApplication: StartApplication = async function startApplication(
  defaultSyncServerHost: string,
  device: WebOrDesktopDevice,
  enableUnfinishedFeatures: boolean,
  webSocketUrl: string,
) {
  SNLog.onLog = console.log
  SNLog.onError = console.error

  const mainApplicationGroup = new ApplicationGroup(
    defaultSyncServerHost,
    device,
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
    new WebDevice(WebAppVersion),
    window.enabledUnfinishedFeatures,
    window.websocketUrl,
  ).catch(console.error)
} else {
  window.startApplication = startApplication
}
