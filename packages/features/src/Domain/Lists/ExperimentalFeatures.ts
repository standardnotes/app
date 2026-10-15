import { RoleName } from '@standardnotes/domain-core'
import { AnyFeatureDescription } from '../Feature/AnyFeatureDescription'
import { NativeFeatureIdentifier } from '../Feature/NativeFeatureIdentifier'
import { PermissionName } from '../Permission/PermissionName'
import { c } from 'ttag'

export function experimentalFeatures(): AnyFeatureDescription[] {
  return [
    {
      name: c('B6.Preferences.General.Labs.Localization.Name').t`Localization`,
      description: c('B6.Preferences.General.Labs.Localization.Description')
        .t`Use the app in your preferred language. Your browser language is used when no preference is set.`,
      availableInRoles: [RoleName.NAMES.CoreUser, RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
      identifier: NativeFeatureIdentifier.TYPES.Localization,
      permission_name: PermissionName.Localization,
    },
    {
      name: c('B7.FilesSubscriptionHelp.Subscription.Info').t`Private vaults`,
      description: c('B7.FilesSubscriptionHelp.Subscription.Info')
        .t`Private vaults allow you to store notes, files and tags into separate, encrypted vaults.`,
      availableInRoles: [RoleName.NAMES.CoreUser, RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
      identifier: NativeFeatureIdentifier.TYPES.Vaults,
      permission_name: PermissionName.Vaults,
    },
  ]
}
