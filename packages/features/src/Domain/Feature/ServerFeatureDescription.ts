import { PermissionName } from '../Permission/PermissionName'
import { RoleFields } from './RoleFields'

export type ServerFeatureDescription = RoleFields & {
  name: string
  description?: string
  identifier: string
  permission_name: PermissionName
  deprecated?: boolean
}
