import { isDev } from '@/Utils'

export const ViewportHeightKey = '--viewport-height'

export const setViewportHeightWithFallback = () => {
  const currentHeight = parseInt(document.documentElement.style.getPropertyValue(ViewportHeightKey))
  const newValue = visualViewport && visualViewport.height > 0 ? visualViewport.height : window.innerHeight

  if (isDev) {
    // eslint-disable-next-line no-console
    console.log(`currentHeight: ${currentHeight}, newValue: ${newValue}`)
  }

  if (currentHeight && newValue < currentHeight) {
    return
  }

  if (!newValue) {
    document.documentElement.style.setProperty(ViewportHeightKey, '100vh')
    return
  }

  document.documentElement.style.setProperty(ViewportHeightKey, `${newValue}px`)
}
