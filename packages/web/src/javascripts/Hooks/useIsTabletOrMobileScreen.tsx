import { WebApplication } from '@/Application/Application'
import { useApplication } from '@/Components/ApplicationProvider'
import { debounce, isMobileScreen, isTabletOrMobileScreen, isTabletScreen } from '@/Utils'
import { useEffect, useState } from 'react'

export function getIsTabletOrMobileScreen(application: WebApplication) {
  const isNativeMobile = application.isNativeMobileWeb()
  const isTabletOrMobile = isTabletOrMobileScreen() || isNativeMobile
  const isTablet = isTabletScreen() || (isNativeMobile && !isMobileScreen())
  const isMobile = isMobileScreen() || (isNativeMobile && !isTablet)

  if (isTablet && isMobile) {
    throw Error('isTablet and isMobile cannot both be true')
  }

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
    const handleResize = debounce(() => {
      setWindowSize(window.innerWidth)
    }, 100)

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return getIsTabletOrMobileScreen(application)
}
