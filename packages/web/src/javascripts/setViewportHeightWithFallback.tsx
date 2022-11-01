import { isDev } from '@/Utils'

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
  if (isDev) {
    // eslint-disable-next-line no-console
    console.log(`setCustomViewportHeight: ${height}`)
  }

  document.documentElement.style.setProperty(ViewportHeightKey, `${height}px`)
}
