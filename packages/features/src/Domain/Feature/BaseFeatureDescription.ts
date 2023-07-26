import { PermissionName } from '../Permission/PermissionName'
import { ComponentFlag } from '../Component/ComponentFlag'
import { RoleFields } from './RoleFields'

export type BaseFeatureDescription = RoleFields & {
  deletion_warning?: string
  deprecated?: boolean
  deprecation_message?: string
  description?: string
  expires_at?: number

  /** Whether the client controls availability of this feature (such as the dark theme) */
  clientControlled?: boolean

  flags?: ComponentFlag[]
  identifier: string
  marketing_url?: string
  name: string
  no_expire?: boolean
  no_mobile?: boolean
  thumbnail_url?: string
  permission_name: PermissionName
}
