import { log, LoggingDomain } from './Logging'

export const ViewportHeightKey = '--viewport-height'

export const setViewportHeightWithFallback = () => {
  const newValue = visualViewport && visualViewport.height > 0 ? visualViewport.height : window.innerHeight

  if (!newValue) {
    setCustomViewportHeight('100vh')
    return
  }

  setCustomViewportHeight(String(newValue))
}

export const setCustomViewportHeight = (height: string) => {
  log(LoggingDomain.Viewport, `setCustomViewportHeight: ${height}`)

  document.documentElement.style.setProperty(ViewportHeightKey, `${height}px`)
}
