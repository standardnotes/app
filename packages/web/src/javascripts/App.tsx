'use strict'

import { disableIosTextFieldZoom, isDev } from '@/Utils'

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
import { DesktopManagerInterface, Environment, MobileDeviceInterface, Platform, SNLog } from '@standardnotes/snjs'
import ApplicationGroupView from './Components/ApplicationGroupView/ApplicationGroupView'
import { WebDevice } from './Application/Device/WebDevice'
import { StartApplication } from './Application/Device/StartApplication'
import { ApplicationGroup } from './Application/ApplicationGroup'
import { WebOrDesktopDevice } from './Application/Device/WebOrDesktopDevice'
import { WebApplication } from './Application/Application'
import { createRoot, Root } from 'react-dom/client'
import { ElementIds } from './Constants/ElementIDs'
import { MediaQueryBreakpoints } from './Hooks/useMediaQuery'
import { storage, StorageKey } from '@standardnotes/ui-services'

let keyCount = 0
const getKey = () => {
  return keyCount++
}

const ViewportHeightKey = '--viewport-height'

export const setViewportHeightWithFallback = (mobileDeviceHeight?: number | null) => {
  const persistedHeight = storage.get(StorageKey.ViewportHeight)
  const currentHeight = parseInt(document.documentElement.style.getPropertyValue(ViewportHeightKey))
  const newValue = mobileDeviceHeight
    ? mobileDeviceHeight
    : visualViewport && visualViewport.height > 0
    ? visualViewport.height
    : window.innerHeight

  if (isDev) {
    // eslint-disable-next-line no-console
    console.log(`persistedHeight: ${persistedHeight}, currentHeight: ${currentHeight}, newValue: ${newValue}`)
  }

  if (currentHeight && newValue < currentHeight) {
    document.documentElement.style.setProperty(ViewportHeightKey, `${currentHeight}px`)
    return
  }

  if (persistedHeight && newValue < persistedHeight) {
    document.documentElement.style.setProperty(ViewportHeightKey, `${persistedHeight}px`)
    return
  }

  if (!newValue) {
    document.documentElement.style.setProperty(ViewportHeightKey, '100vh')
    return
  }

  document.documentElement.style.setProperty(ViewportHeightKey, `${newValue}px`)
  storage.set(StorageKey.ViewportHeight, newValue)
}

const setDefaultMonospaceFont = (platform?: Platform) => {
  if (platform === Platform.Android) {
    document.documentElement.style.setProperty(
      '--sn-stylekit-monospace-font',
      '"Roboto Mono", "Droid Sans Mono", monospace',
    )
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

  const isDesktop =
    device.environment === Environment.Desktop ||
    (matchMedia(MediaQueryBreakpoints.md).matches && matchMedia(MediaQueryBreakpoints.pointerFine))

  const getLatestMobileDeviceHeight = () => {
    const mobileDeviceHeight =
      device.environment === Environment.NativeMobileWeb
        ? (device as unknown as MobileDeviceInterface).getWindowDimensions().height
        : null
    return mobileDeviceHeight
  }

  const orientationChangeHandler = () => {
    setViewportHeightWithFallback(getLatestMobileDeviceHeight())
  }

  const resizeHandler = () => {
    setViewportHeightWithFallback(getLatestMobileDeviceHeight())
  }

  const setupViewportHeightListeners = () => {
    if (!isDesktop) {
      setViewportHeightWithFallback(getLatestMobileDeviceHeight())
      window.addEventListener('orientationchange', orientationChangeHandler)
      window.addEventListener('resize', resizeHandler)
    }
  }

  const removeViewportHeightListeners = () => {
    if (!isDesktop) {
      window.removeEventListener('orientationchange', orientationChangeHandler)
      window.removeEventListener('resize', resizeHandler)
    }
  }

  const onDestroy = () => {
    removeViewportHeightListeners()
    const rootElement = document.getElementById(ElementIds.RootId) as HTMLElement
    root.unmount()
    rootElement.remove()
    renderApp()
  }

  const renderApp = () => {
    const rootElement = document.createElement('div')
    rootElement.id = ElementIds.RootId
    const appendedRootNode = document.body.appendChild(rootElement)
    root = createRoot(appendedRootNode)

    disableIosTextFieldZoom()

    setupViewportHeightListeners()

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
