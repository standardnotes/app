import { log, LoggingDomain } from './Logging'

export const ViewportHeightKey = '--viewport-height'

/**
 * @param forceTriggerResizeEvent On iPad at least, setProperty(ViewportHeightKey) does not trigger a resize event
 */
export const setCustomViewportHeight = (height: number, suffix: 'px' | 'vh', forceTriggerResizeEvent = false) => {
  const value = `${height}${suffix}`

  log(LoggingDomain.Viewport, `setCustomViewportHeight: ${value}`)

  document.documentElement.style.setProperty(ViewportHeightKey, value)

  if (forceTriggerResizeEvent) {
    window.dispatchEvent(new Event('resize'))
  }
}
