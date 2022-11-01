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

export const setCustomViewportHeight = (height: string, suffix: 'px' | 'vh') => {
  log(LoggingDomain.Viewport, `setCustomViewportHeight: ${height}`)

  document.documentElement.style.setProperty(ViewportHeightKey, `${height}${suffix}`)

  /** On iPad at least, the above setProperty does not trigger a resize event */
  window.dispatchEvent(new Event('resize'))
}
