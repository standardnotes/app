import { ComponentOrNativeTheme, FeatureIdentifier } from '@standardnotes/snjs'

const isDarkModeTheme = (theme: ComponentOrNativeTheme) => theme.identifier === FeatureIdentifier.DarkTheme

export const sortThemes = (a: ComponentOrNativeTheme, b: ComponentOrNativeTheme) => {
  const aIsLayerable = a.layerable
  const bIsLayerable = b.layerable

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
