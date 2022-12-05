import { useEffect, useState } from 'react'

// Follows https://tailwindcss.com/docs/responsive-design
export const MediaQueryBreakpoints = {
  sm: '(max-width: 767px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width:  1536px)',
  pointerFine: '(pointer: fine)',
} as const

export const MutuallyExclusiveMediaQueryBreakpoints = {
  sm: '(min-width: 0px) and (max-width: 767px)',
  md: '(min-width: 768px) and (max-width: 1023px)',
  lg: '(min-width: 1024px) and (max-width: 1279px)',
  xl: '(min-width: 1280px) and (max-width: 1536px)',
  '2xl': '(min-width:  1536px)',
  pointerFine: '(pointer: fine)',
} as const

export const useMediaQuery = (mediaQuery: string) => {
  const [matches, setMatches] = useState(() => window.matchMedia(mediaQuery).matches)

  useEffect(() => {
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    const mq = window.matchMedia(mediaQuery)
    if (mq.addEventListener != undefined) {
      mq.addEventListener('change', handler)
    } else {
      mq.addListener(handler)
    }

    return () => {
      const mq = window.matchMedia(mediaQuery)
      if (mq.removeEventListener != undefined) {
        mq.removeEventListener('change', handler)
      } else {
        mq.removeListener(handler)
      }
    }
  }, [mediaQuery])

  return matches
}
