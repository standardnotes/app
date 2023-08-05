import { isIOS } from '@standardnotes/ui-services'
import { useEffect, useState } from 'react'

const DebounceTimeInMs = 100

const getBoundingClientRect = () => {
  return isIOS() ? document.body.getBoundingClientRect() : document.documentElement.getBoundingClientRect()
}

export const useDocumentRect = (): DOMRect => {
  const [documentRect, setDocumentRect] = useState<DOMRect>(getBoundingClientRect())

  useEffect(() => {
    let debounceTimeout: number

    const handleWindowResize = () => {
      window.clearTimeout(debounceTimeout)

      window.setTimeout(() => {
        setDocumentRect(getBoundingClientRect())
      }, DebounceTimeInMs)
    }

    window.addEventListener('resize', handleWindowResize)

    return () => window.removeEventListener('resize', handleWindowResize)
  }, [])

  return documentRect
}
