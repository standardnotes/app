import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { EditorFontSize } from '@standardnotes/snjs'

export const useResponsiveEditorFontSize = (key: EditorFontSize): string => {
  const desktopMapping: Record<EditorFontSize, string> = {
    ExtraSmall: 'text-xs',
    Small: 'text-sm',
    Normal: 'text-editor',
    Medium: 'text-lg',
    Large: 'text-xl',
  }

  const mobileMapping: Record<EditorFontSize, string> = {
    ExtraSmall: 'text-sm',
    Small: 'text-editor',
    Normal: 'text-lg',
    Medium: 'text-xl',
    Large: 'text-2xl',
  }

  const tabletMapping: Record<EditorFontSize, string> = {
    ExtraSmall: 'text-sm',
    Small: 'text-editor',
    Normal: 'text-base',
    Medium: 'text-xl',
    Large: 'text-2xl',
  }

  const isTabletScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.md)
  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  if (isTabletScreen) {
    return tabletMapping[key]
  }

  return isMobileScreen ? mobileMapping[key] : desktopMapping[key]
}
