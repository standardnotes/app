import { PermissionName } from '../Permission/PermissionName'
import { FeatureIdentifier } from '../Feature/FeatureIdentifier'
import { RoleName } from '@standardnotes/domain-core'
import { ClientFeatureDescription } from '../Feature/ClientFeatureDescription'

export function clientFeatures(): ClientFeatureDescription[] {
  return [
    {
      name: 'Tag Nesting',
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
      identifier: FeatureIdentifier.TagNesting,
      permission_name: PermissionName.TagNesting,
      description: 'Organize your tags into folders.',
    },

    {
      name: 'Smart Filters',
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
      identifier: FeatureIdentifier.SmartFilters,
      permission_name: PermissionName.SmartFilters,
      description: 'Create smart filters for viewing notes matching specific criteria.',
    },
    {
      name: 'Encrypted files',
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
      identifier: FeatureIdentifier.Files,
      permission_name: PermissionName.Files,
      description: '',
    },
    {
      name: 'Extension',
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
      identifier: FeatureIdentifier.Extension,
      permission_name: PermissionName.Extension,
      description: '',
    },
  ]
}
