import { PermissionName } from '../Permission/PermissionName'
import { NativeFeatureIdentifier } from '../Feature/NativeFeatureIdentifier'
import { RoleName } from '@standardnotes/domain-core'
import { ClientFeatureDescription } from '../Feature/ClientFeatureDescription'
import { c } from 'ttag'
import { ClipperName } from '../Strings/ProductNames'

export function clientFeatures(): ClientFeatureDescription[] {
  return [
    {
      name: c('B7.FilesSubscriptionHelp.Subscription.Info').t`Tag Nesting`,
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
      identifier: NativeFeatureIdentifier.TYPES.TagNesting,
      permission_name: PermissionName.TagNesting,
      description: c('B7.FilesSubscriptionHelp.Subscription.Info').t`Organize your tags into folders.`,
    },

    {
      name: c('B7.FilesSubscriptionHelp.Subscription.Info').t`Smart Filters`,
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
      identifier: NativeFeatureIdentifier.TYPES.SmartFilters,
      permission_name: PermissionName.SmartFilters,
      description: c('B7.FilesSubscriptionHelp.Subscription.Info')
        .t`Create smart filters for viewing notes matching specific criteria.`,
    },
    {
      name: c('B7.FilesSubscriptionHelp.Subscription.Info').t`Encrypted files`,
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
      identifier: NativeFeatureIdentifier.TYPES.Files,
      permission_name: PermissionName.Files,
      description: '',
    },
    {
      name: ClipperName,
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
      identifier: NativeFeatureIdentifier.TYPES.Clipper,
      permission_name: PermissionName.Clipper,
      description: '',
    },
  ]
}
