import { PermissionName } from '../Permission/PermissionName'
import { RoleFields } from './RoleFields'

export type ClientFeatureDescription = RoleFields & {
  identifier: string
  permission_name: PermissionName
  description: string
  name: string
  deprecated?: boolean
}
