import { WebApplication } from '@/Application/Application'
import { useApplication } from '@/Components/ApplicationProvider'
import { isMobileScreen, isTabletOrMobileScreen, isTabletScreen } from '@/Utils'
import { useEffect, useState } from 'react'

export function getIsTabletOrMobileScreen(application: WebApplication) {
  const isNativeMobile = application.isNativeMobileWeb()
  const isTabletOrMobile = isTabletOrMobileScreen() || isNativeMobile
  const isTablet = isTabletScreen() || (isNativeMobile && !isMobileScreen())
  const isMobile = isMobileScreen() || (isNativeMobile && !isTablet)

  return {
    isTabletOrMobile,
    isTablet,
    isMobile,
  }
}

export default function useIsTabletOrMobileScreen() {
  const [_windowSize, setWindowSize] = useState(0)
  const application = useApplication()

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

  return getIsTabletOrMobileScreen(application)
}
