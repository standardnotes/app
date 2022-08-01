// Based on https://tailwindcss.com/docs/responsive-design

export const MediaQueryBreakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

export const MediaQuery = {
  sm: `(min-width: ${MediaQueryBreakpoints.sm})`,
  md: `(min-width: ${MediaQueryBreakpoints.md})`,
  lg: `(min-width: ${MediaQueryBreakpoints.lg})`,
  xl: `(min-width: ${MediaQueryBreakpoints.xl})`,
  '2xl': `(min-width: ${MediaQueryBreakpoints['2xl']})`,
} as const
