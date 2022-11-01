import { log, LoggingDomain } from './Logging'

/**
 * @param forceTriggerResizeEvent On iPad at least, setProperty(ViewportHeightKey) does not trigger a resize event
 */
export const setCustomViewportHeight = (height: number, suffix: 'px' | 'vh', forceTriggerResizeEvent = false) => {
  const value = `${height}${suffix}`

  log(LoggingDomain.Viewport, `setCustomViewportHeight: ${value}`)

  document.body.style.height = value

  if (forceTriggerResizeEvent) {
    window.dispatchEvent(new Event('resize'))
  }
}
