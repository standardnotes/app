import { isMobileScreen } from '@/Utils'
import { useEffect, useRef } from 'react'

/**
 * Used to disable scroll on document.body when opening popovers or preferences view
 * on mobile so that user can only scroll within the popover or prefs view
 */
export const useDisableBodyScrollOnMobile = () => {
  const styleElementRef = useRef<HTMLStyleElement | null>(null)

  useEffect(() => {
    const isMobile = isMobileScreen()

    if (isMobile && !styleElementRef.current) {
      const styleElement = document.createElement('style')
      styleElement.textContent = 'body { overflow: hidden; }'
      document.body.appendChild(styleElement)
      styleElementRef.current = styleElement
    }

    return () => {
      if (isMobile && styleElementRef.current) {
        styleElementRef.current.remove()
      }
    }
  }, [])
}
