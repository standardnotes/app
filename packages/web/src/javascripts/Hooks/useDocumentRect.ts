import { useEffect, useState } from 'react'

const DebounceTimeInMs = 100

export const useDocumentRect = (): DOMRect => {
  const [documentRect, setDocumentRect] = useState<DOMRect>(document.documentElement.getBoundingClientRect())

  useEffect(() => {
    let debounceTimeout: number

    const handleWindowResize = () => {
      window.clearTimeout(debounceTimeout)

      window.setTimeout(() => {
        setDocumentRect(document.documentElement.getBoundingClientRect())
      }, DebounceTimeInMs)
    }

    window.addEventListener('resize', handleWindowResize)

    return () => window.removeEventListener('resize', handleWindowResize)
  }, [])

  return documentRect
}
