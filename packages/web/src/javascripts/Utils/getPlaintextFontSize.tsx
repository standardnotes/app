import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { EditorFontSize } from '@standardnotes/snjs'

export const useResponsiveEditorFontSize = (key: EditorFontSize, useTailwindClasses = true): string => {
  const desktopMapping: Record<EditorFontSize, string> = {
    ExtraSmall: useTailwindClasses ? 'text-xs' : '0.75rem',
    Small: useTailwindClasses ? 'text-sm' : '0.875rem',
    Normal: useTailwindClasses ? 'text-editor' : 'var(--sn-stylekit-font-size-editor)',
    Medium: useTailwindClasses ? 'text-lg' : '1.125rem',
    Large: useTailwindClasses ? 'text-xl' : '1.25rem',
  }

  const mobileMapping: Record<EditorFontSize, string> = {
    ExtraSmall: useTailwindClasses ? 'text-sm' : '0.875rem',
    Small: useTailwindClasses ? 'text-editor' : 'var(--sn-stylekit-font-size-editor)',
    Normal: useTailwindClasses ? 'text-lg' : '1.125rem',
    Medium: useTailwindClasses ? 'text-xl' : '1.25rem',
    Large: useTailwindClasses ? 'text-2xl' : '1.5rem',
  }

  const tabletMapping: Record<EditorFontSize, string> = {
    ExtraSmall: useTailwindClasses ? 'text-sm' : '0.875rem',
    Small: useTailwindClasses ? 'text-editor' : 'var(--sn-stylekit-font-size-editor)',
    Normal: useTailwindClasses ? 'text-base' : '1rem',
    Medium: useTailwindClasses ? 'text-xl' : '1.25rem',
    Large: useTailwindClasses ? 'text-2xl' : '1.5rem',
  }

  const isTabletScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.md)
  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  if (isTabletScreen) {
    return tabletMapping[key]
  }

  return isMobileScreen ? mobileMapping[key] : desktopMapping[key]
}
