import { RoleName } from '@standardnotes/domain-core'
import { AnyFeatureDescription } from '../Feature/AnyFeatureDescription'
import { NativeFeatureIdentifier } from '../Feature/NativeFeatureIdentifier'
import { PermissionName } from '../Permission/PermissionName'

export function experimentalFeatures(): AnyFeatureDescription[] {
  return [
    {
      name: 'Private vaults',
      description:
        'Private vaults allow you to store notes, files and tags into separate, encrypted vaults. You can create as many private vaults as you want, and you can share them with other users.',
      availableInRoles: [RoleName.NAMES.CoreUser, RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
      identifier: NativeFeatureIdentifier.TYPES.Vaults,
      permission_name: PermissionName.Vaults,
    },
  ]
}
