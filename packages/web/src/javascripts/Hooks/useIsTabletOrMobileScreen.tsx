import { WebApplication } from '@/Application/Application'
import { useApplication } from '@/Components/ApplicationProvider'
import { isMobileScreen, isTabletOrMobileScreen, isTabletScreen } from '@/Utils'
import { useEffect, useState } from 'react'
import { MediaQueryBreakpoints } from './useMediaQuery'

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
  const [, setMatchesSmallBreakpoint] = useState(false)
  const [, setMatchesMediumBreakpoint] = useState(false)
  const [, setMatchesLargeBreakpoint] = useState(false)
  const application = useApplication()

  useEffect(() => {
    const smallBreakpoint = matchMedia(MediaQueryBreakpoints.sm)
    const mediumBreakpoint = matchMedia(MediaQueryBreakpoints.md)
    const largeBreakpoint = matchMedia(MediaQueryBreakpoints.lg)

    const handleSmallBreakpointChange = (event: MediaQueryListEvent) => {
      setMatchesSmallBreakpoint(event.matches)
    }
    const handleMediumBreakpointChange = (event: MediaQueryListEvent) => {
      setMatchesMediumBreakpoint(event.matches)
    }
    const handleLargeBreakpointChange = (event: MediaQueryListEvent) => {
      setMatchesLargeBreakpoint(event.matches)
    }

    smallBreakpoint.addEventListener('change', handleSmallBreakpointChange)
    mediumBreakpoint.addEventListener('change', handleMediumBreakpointChange)
    largeBreakpoint.addEventListener('change', handleLargeBreakpointChange)

    return () => {
      smallBreakpoint.removeEventListener('change', handleSmallBreakpointChange)
      mediumBreakpoint.removeEventListener('change', handleMediumBreakpointChange)
      largeBreakpoint.removeEventListener('change', handleLargeBreakpointChange)
    }
  }, [])

  return getIsTabletOrMobileScreen(application)
}
