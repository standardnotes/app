import { useEffect } from 'react'

export const useBeforeUnload = (): void => {
  useEffect(() => {
    window.onbeforeunload = () => true

    return () => {
      window.onbeforeunload = null
    }
  }, [])
}
