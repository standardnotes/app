import { PermissionName } from '../Permission/PermissionName'
import { FeatureIdentifier } from './FeatureIdentifier'
import { RoleFields } from './RoleFields'

export type ServerFeatureDescription = RoleFields & {
  name: string
  description?: string
  identifier: FeatureIdentifier
  permission_name: PermissionName
  deprecated?: boolean
}
