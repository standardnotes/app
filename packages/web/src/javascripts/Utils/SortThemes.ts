import { ComponentOrNativeFeature, FeatureIdentifier, ThemeFeatureDescription } from '@standardnotes/snjs'

const isDarkModeTheme = (theme: ComponentOrNativeFeature<ThemeFeatureDescription>) =>
  theme.featureIdentifier === FeatureIdentifier.DarkTheme

export const sortThemes = (
  a: ComponentOrNativeFeature<ThemeFeatureDescription>,
  b: ComponentOrNativeFeature<ThemeFeatureDescription>,
) => {
  const aIsLayerable = a.layerable
  const bIsLayerable = b.layerable

  if (aIsLayerable && !bIsLayerable) {
    return 1
  } else if (!aIsLayerable && bIsLayerable) {
    return -1
  } else if (!isDarkModeTheme(a) && isDarkModeTheme(b)) {
    return 1
  } else {
    return a.displayName.toLowerCase() < b.displayName.toLowerCase() ? -1 : 1
  }
}
