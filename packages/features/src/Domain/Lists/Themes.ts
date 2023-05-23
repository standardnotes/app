import { ThemeFeatureDescription } from '../Feature/FeatureDescription'
import { PermissionName } from '../Permission/PermissionName'
import { FeatureIdentifier } from '../Feature/FeatureIdentifier'
import { FillThemeComponentDefaults } from './Utilities/FillThemeComponentDefaults'
import { RoleName } from '@standardnotes/domain-core'

export function themes(): ThemeFeatureDescription[] {
  const midnight: ThemeFeatureDescription = FillThemeComponentDefaults({
    name: 'Midnight',
    identifier: FeatureIdentifier.MidnightTheme,
    permission_name: PermissionName.MidnightTheme,
    isDark: true,
    dock_icon: {
      type: 'circle',
      background_color: '#086DD6',
      foreground_color: '#ffffff',
      border_color: '#086DD6',
    },
    availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
  })

  const futura: ThemeFeatureDescription = FillThemeComponentDefaults({
    availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
    name: 'Futura',
    identifier: FeatureIdentifier.FuturaTheme,
    permission_name: PermissionName.FuturaTheme,
    isDark: true,
    dock_icon: {
      type: 'circle',
      background_color: '#fca429',
      foreground_color: '#ffffff',
      border_color: '#fca429',
    },
  })

  const solarizedDark: ThemeFeatureDescription = FillThemeComponentDefaults({
    availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
    name: 'Solarized Dark',
    identifier: FeatureIdentifier.SolarizedDarkTheme,
    permission_name: PermissionName.SolarizedDarkTheme,
    isDark: true,
    dock_icon: {
      type: 'circle',
      background_color: '#2AA198',
      foreground_color: '#ffffff',
      border_color: '#2AA198',
    },
  })

  const autobiography: ThemeFeatureDescription = FillThemeComponentDefaults({
    availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
    name: 'Autobiography',
    identifier: FeatureIdentifier.AutobiographyTheme,
    permission_name: PermissionName.AutobiographyTheme,
    dock_icon: {
      type: 'circle',
      background_color: '#9D7441',
      foreground_color: '#ECE4DB',
      border_color: '#9D7441',
    },
  })

  const dark: ThemeFeatureDescription = FillThemeComponentDefaults({
    availableInRoles: [RoleName.NAMES.CoreUser, RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
    name: 'Dark',
    identifier: FeatureIdentifier.DarkTheme,
    permission_name: PermissionName.FocusedTheme,
    clientControlled: true,
    isDark: true,
    dock_icon: {
      type: 'circle',
      background_color: '#a464c2',
      foreground_color: '#ffffff',
      border_color: '#a464c2',
    },
  })

  const titanium: ThemeFeatureDescription = FillThemeComponentDefaults({
    availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
    name: 'Titanium',
    identifier: FeatureIdentifier.TitaniumTheme,
    permission_name: PermissionName.TitaniumTheme,
    dock_icon: {
      type: 'circle',
      background_color: '#6e2b9e',
      foreground_color: '#ffffff',
      border_color: '#6e2b9e',
    },
  })

  const dynamic: ThemeFeatureDescription = FillThemeComponentDefaults({
    availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
    name: 'Dynamic Panels',
    identifier: FeatureIdentifier.DynamicTheme,
    permission_name: PermissionName.ThemeDynamic,
    layerable: true,
    no_mobile: true,
  })

  return [midnight, futura, solarizedDark, autobiography, dark, titanium, dynamic]
}
