import { useEffect, useState } from 'react'

// Follows https://tailwindcss.com/docs/responsive-design
export const MediaQueryBreakpoints = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width:  1536px)',
  pointerFine: '(pointer: fine)',
} as const

export const useMediaQuery = (mediaQuery: string) => {
  const [matches, setMatches] = useState(() => window.matchMedia(mediaQuery).matches)

  useEffect(() => {
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    window.matchMedia(mediaQuery).addEventListener('change', handler)

    return () => window.matchMedia(mediaQuery).removeEventListener('change', handler)
  }, [mediaQuery])

  return matches
}
