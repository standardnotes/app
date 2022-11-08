import { isMobileScreen, isTabletScreen } from '@/Utils'
import { EditorFontSize } from '@standardnotes/snjs'

export const getPlaintextFontSize = (key: EditorFontSize): string => {
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
    Large: 'text-xl2',
  }

  const tabletMapping: Record<EditorFontSize, string> = {
    ExtraSmall: 'text-sm',
    Small: 'text-editor',
    Normal: 'text-base',
    Medium: 'text-xl',
    Large: 'text-xl2',
  }

  if (isTabletScreen()) {
    return tabletMapping[key]
  }

  return isMobileScreen() ? mobileMapping[key] : desktopMapping[key]
}
