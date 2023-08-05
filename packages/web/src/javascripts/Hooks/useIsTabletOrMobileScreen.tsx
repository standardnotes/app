import { IsTabletOrMobileScreen } from '@/Application/UseCase/IsTabletOrMobileScreen'
import { useApplication } from '@/Components/ApplicationProvider'
import { debounce } from '@/Utils'
import { useEffect, useMemo, useState } from 'react'

export default function useIsTabletOrMobileScreen() {
  const [_windowSize, setWindowSize] = useState(0)
  const application = useApplication()
  const usecase = useMemo(() => new IsTabletOrMobileScreen(application.environment), [application])

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

  const isTabletOrMobileScreen = usecase.execute().getValue()
  return isTabletOrMobileScreen
}
