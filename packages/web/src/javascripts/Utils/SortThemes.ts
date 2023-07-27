import { UIFeature, NativeFeatureIdentifier, ThemeFeatureDescription } from '@standardnotes/snjs'

const isDarkModeTheme = (theme: UIFeature<ThemeFeatureDescription>) =>
  theme.featureIdentifier === NativeFeatureIdentifier.TYPES.DarkTheme

export const sortThemes = (a: UIFeature<ThemeFeatureDescription>, b: UIFeature<ThemeFeatureDescription>) => {
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
