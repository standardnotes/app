'use strict'

import { disableIosTextFieldZoom, isIOS } from '@/Utils'

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
    MSStream?: Record<string, unknown>
  }
}

import { IsWebPlatform, WebAppVersion } from '@/Constants/Version'
import { DesktopManagerInterface, SNLog } from '@standardnotes/snjs'
import ApplicationGroupView from './Components/ApplicationGroupView/ApplicationGroupView'
import { WebDevice } from './Application/Device/WebDevice'
import { StartApplication } from './Application/Device/StartApplication'
import { ApplicationGroup } from './Application/ApplicationGroup'
import { WebOrDesktopDevice } from './Application/Device/WebOrDesktopDevice'
import { WebApplication } from './Application/Application'
import { createRoot, Root } from 'react-dom/client'

let keyCount = 0
const getKey = () => {
  return keyCount++
}

const RootId = 'app-group-root'

let currentViewportHeight = visualViewport.height
const setViewportHeight = () => {
  const oldViewportHeight = currentViewportHeight
  currentViewportHeight = visualViewport.height
  document.documentElement.style.setProperty('--viewport-height', `${currentViewportHeight}px`)

  if (isIOS()) {
    // Required on iOS as otherwise the UI gets pushed upwards when the keyboard is opened.
    document.querySelector('.main-ui-view')?.scrollIntoView({
      inline: 'end',
    })

    setTimeout(() => {
      // Required on iOS to make sure the textarea is scrolled to position of the cursor
      // instead of the content staying under the keyboard.
      if (document.activeElement?.tagName === 'TEXTAREA' && oldViewportHeight !== currentViewportHeight) {
        let element = document.activeElement as HTMLTextAreaElement
        element.blur()
        element.focus()
      }
    })
  }
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
  let viewportHeightInterval: number

  const onDestroy = () => {
    const rootElement = document.getElementById(RootId) as HTMLElement
    root.unmount()
    rootElement.remove()
    if (viewportHeightInterval) {
      clearInterval(viewportHeightInterval)
    }
    renderApp()
  }

  const renderApp = () => {
    const rootElement = document.createElement('div')
    rootElement.id = RootId
    const appendedRootNode = document.body.appendChild(rootElement)
    root = createRoot(appendedRootNode)

    setViewportHeight()
    viewportHeightInterval = window.setInterval(() => {
      setViewportHeight()
    }, 250)

    disableIosTextFieldZoom()

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
