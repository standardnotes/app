import { RoleName } from '@standardnotes/domain-core'
import { AnyFeatureDescription } from '../Feature/AnyFeatureDescription'
import { NativeFeatureIdentifier } from '../Feature/NativeFeatureIdentifier'
import { PermissionName } from '../Permission/PermissionName'
import { c } from 'ttag'

export function experimentalFeatures(): AnyFeatureDescription[] {
  return [
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
