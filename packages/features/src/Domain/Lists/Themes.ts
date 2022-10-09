import { ThemeFeatureDescription } from '../Feature/FeatureDescription'
import { PermissionName } from '../Permission/PermissionName'
import { FeatureIdentifier } from '../Feature/FeatureIdentifier'
import { FillThemeComponentDefaults } from './Utilities/FillThemeComponentDefaults'
import { SubscriptionName } from '@standardnotes/common'

export function themes(): ThemeFeatureDescription[] {
  const midnight: ThemeFeatureDescription = FillThemeComponentDefaults({
    availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
    name: 'Midnight',
    identifier: FeatureIdentifier.MidnightTheme,
    permission_name: PermissionName.MidnightTheme,
    description: 'Elegant utilitarianism.',
    thumbnail_url: 'https://s3.amazonaws.com/standard-notes/screenshots/models/themes/midnight-with-mobile.jpg',
    isDark: true,
    dock_icon: {
      type: 'circle',
      background_color: '#086DD6',
      foreground_color: '#ffffff',
      border_color: '#086DD6',
    },
  })

  const futura: ThemeFeatureDescription = FillThemeComponentDefaults({
    availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
    name: 'Futura',
    identifier: FeatureIdentifier.FuturaTheme,
    permission_name: PermissionName.FuturaTheme,
    description: 'Calm and relaxed. Take some time off.',
    thumbnail_url: 'https://s3.amazonaws.com/standard-notes/screenshots/models/themes/futura-with-mobile.jpg',
    isDark: true,
    dock_icon: {
      type: 'circle',
      background_color: '#fca429',
      foreground_color: '#ffffff',
      border_color: '#fca429',
    },
  })

  const solarizedDark: ThemeFeatureDescription = FillThemeComponentDefaults({
    availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
    name: 'Solarized Dark',
    identifier: FeatureIdentifier.SolarizedDarkTheme,
    permission_name: PermissionName.SolarizedDarkTheme,
    description: 'The perfect theme for any time.',
    thumbnail_url: 'https://s3.amazonaws.com/standard-notes/screenshots/models/themes/solarized-dark.jpg',
    isDark: true,
    dock_icon: {
      type: 'circle',
      background_color: '#2AA198',
      foreground_color: '#ffffff',
      border_color: '#2AA198',
    },
  })

  const autobiography: ThemeFeatureDescription = FillThemeComponentDefaults({
    availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
    name: 'Autobiography',
    identifier: FeatureIdentifier.AutobiographyTheme,
    permission_name: PermissionName.AutobiographyTheme,
    description: 'A theme for writers and readers.',
    thumbnail_url: 'https://s3.amazonaws.com/standard-notes/screenshots/models/themes/autobiography.jpg',
    dock_icon: {
      type: 'circle',
      background_color: '#9D7441',
      foreground_color: '#ECE4DB',
      border_color: '#9D7441',
    },
  })

  const dark: ThemeFeatureDescription = FillThemeComponentDefaults({
    availableInSubscriptions: [],
    name: 'Dark',
    identifier: FeatureIdentifier.DarkTheme,
    permission_name: PermissionName.FocusedTheme,
    description: 'For when you need to go in.',
    thumbnail_url: 'https://s3.amazonaws.com/standard-notes/screenshots/models/themes/focus-with-mobile.jpg',
    isDark: true,
    dock_icon: {
      type: 'circle',
      background_color: '#a464c2',
      foreground_color: '#ffffff',
      border_color: '#a464c2',
    },
  })

  const titanium: ThemeFeatureDescription = FillThemeComponentDefaults({
    availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
    name: 'Titanium',
    identifier: FeatureIdentifier.TitaniumTheme,
    permission_name: PermissionName.TitaniumTheme,
    description: 'Light on the eyes, heavy on the spirit.',
    thumbnail_url: 'https://s3.amazonaws.com/standard-notes/screenshots/models/themes/titanium-with-mobile.jpg',
    dock_icon: {
      type: 'circle',
      background_color: '#6e2b9e',
      foreground_color: '#ffffff',
      border_color: '#6e2b9e',
    },
  })

  const dynamic: ThemeFeatureDescription = FillThemeComponentDefaults({
    availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
    name: 'Dynamic Panels',
    identifier: FeatureIdentifier.DynamicTheme,
    permission_name: PermissionName.ThemeDynamic,
    layerable: true,
    no_mobile: true,
    description: 'A smart theme that minimizes the tags and notes panels when they are not in use.',
  })

  return [midnight, futura, solarizedDark, autobiography, dark, titanium, dynamic]
}
