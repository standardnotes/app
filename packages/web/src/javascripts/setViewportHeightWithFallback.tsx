import { log, LoggingDomain } from './Logging'

export const ViewportHeightKey = '--viewport-height'

export const setViewportHeightWithFallback = () => {
  const newValue = visualViewport && visualViewport.height > 0 ? visualViewport.height : window.innerHeight

  if (!newValue) {
    setCustomViewportHeight('100', 'vh')
    return
  }

  setCustomViewportHeight(String(newValue), 'px')
}

/**
 * @param forceTriggerResizeEvent On iPad at least, setProperty(ViewportHeightKey) does not trigger a resize event
 */
export const setCustomViewportHeight = (height: string, suffix: 'px' | 'vh', forceTriggerResizeEvent = false) => {
  log(LoggingDomain.Viewport, `setCustomViewportHeight: ${height}`)

  document.documentElement.style.setProperty(ViewportHeightKey, `${height}${suffix}`)

  if (forceTriggerResizeEvent) {
    window.dispatchEvent(new Event('resize'))
  }
}
