import { PermissionName } from '../Permission/PermissionName'
import { FeatureIdentifier } from './FeatureIdentifier'
import { RoleFields } from './RoleFields'

export type ServerFeatureDescription = RoleFields & {
  name: string
  identifier: FeatureIdentifier
  permission_name: PermissionName
  deprecated?: boolean
}
