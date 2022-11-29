import { isMobileScreen, isTabletOrMobileScreen, isTabletScreen } from '@/Utils'
import { useEffect, useState } from 'react'

export default function useIsTabletOrMobileScreen() {
  const [_windowSize, setWindowSize] = useState(0)

  useEffect(() => {
    const handleResize = () => {
      setWindowSize(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return { isTabletOrMobile: isTabletOrMobileScreen(), isTablet: isTabletScreen(), isMobile: isMobileScreen() }
}
