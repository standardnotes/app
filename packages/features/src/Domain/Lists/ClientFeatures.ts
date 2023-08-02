import { PermissionName } from '../Permission/PermissionName'
import { NativeFeatureIdentifier } from '../Feature/NativeFeatureIdentifier'
import { RoleName } from '@standardnotes/domain-core'
import { ClientFeatureDescription } from '../Feature/ClientFeatureDescription'

export function clientFeatures(): ClientFeatureDescription[] {
  return [
    {
      name: 'Tag Nesting',
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
      identifier: NativeFeatureIdentifier.TYPES.TagNesting,
      permission_name: PermissionName.TagNesting,
      description: 'Organize your tags into folders.',
    },

    {
      name: 'Smart Filters',
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
      identifier: NativeFeatureIdentifier.TYPES.SmartFilters,
      permission_name: PermissionName.SmartFilters,
      description: 'Create smart filters for viewing notes matching specific criteria.',
    },
    {
      name: 'Encrypted files',
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
      identifier: NativeFeatureIdentifier.TYPES.Files,
      permission_name: PermissionName.Files,
      description: '',
    },
    {
      name: 'Clipper',
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
      identifier: NativeFeatureIdentifier.TYPES.Clipper,
      permission_name: PermissionName.Clipper,
      description: '',
    },
  ]
}
