import { useEffect, useState } from 'react'

const DEBOUNCE_TIME = 150

export const useDocumentRect = (): DOMRect => {
  const [documentRect, setDocumentRect] = useState<DOMRect>(document.documentElement.getBoundingClientRect())

  useEffect(() => {
    let debounceTimeout: number

    const handleWindowResize = () => {
      window.clearTimeout(debounceTimeout)

      window.setTimeout(() => {
        setDocumentRect(document.documentElement.getBoundingClientRect())
      }, DEBOUNCE_TIME)
    }

    window.addEventListener('resize', handleWindowResize)

    return () => window.removeEventListener('resize', handleWindowResize)
  }, [])

  return documentRect
}
