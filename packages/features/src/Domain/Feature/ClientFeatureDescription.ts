import { PermissionName } from '../Permission/PermissionName'
import { FeatureIdentifier } from './FeatureIdentifier'
import { RoleFields } from './RoleFields'

export type ClientFeatureDescription = RoleFields & {
  identifier: FeatureIdentifier
  permission_name: PermissionName
  description: string
  name: string
  deprecated?: boolean
}
