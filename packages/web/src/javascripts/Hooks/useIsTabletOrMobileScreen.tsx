import { useApplication } from '@/Components/ApplicationProvider'
import { debounce, isMobileScreen, isTabletOrMobileScreen, isTabletScreen } from '@/Utils'
import { WebApplicationInterface } from '@standardnotes/ui-services'
import { useEffect, useState } from 'react'

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
