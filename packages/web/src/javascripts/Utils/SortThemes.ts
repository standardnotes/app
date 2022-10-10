import { ThemeItem } from '@/Components/QuickSettingsMenu/ThemeItem'
import { FeatureIdentifier } from '@standardnotes/snjs'

const isDarkModeTheme = (theme: ThemeItem) => theme.identifier === FeatureIdentifier.DarkTheme

export const sortThemes = (a: ThemeItem, b: ThemeItem) => {
  const aIsLayerable = a.component?.isLayerable()
  const bIsLayerable = b.component?.isLayerable()

  if (aIsLayerable && !bIsLayerable) {
    return 1
  } else if (!aIsLayerable && bIsLayerable) {
    return -1
  } else if (!isDarkModeTheme(a) && isDarkModeTheme(b)) {
    return 1
  } else {
    return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1
  }
}
