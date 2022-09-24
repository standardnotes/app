import { ComponentPermission } from '../Component/ComponentPermission'
import { ContentType, RoleName, SubscriptionName } from '@standardnotes/common'
import { ComponentArea } from '../Component/ComponentArea'
import { PermissionName } from '../Permission/PermissionName'
import { FeatureIdentifier } from './FeatureIdentifier'
import { ComponentFlag } from '../Component/ComponentFlag'
import { NoteType } from '../Component/NoteType'
import { ThemeDockIcon } from '../Component/ThemeDockIcon'

type RoleFields = {
  /** Server populated */
  role_name?: RoleName

  /** Statically populated. Non-influencing; used as a reference by other static consumers (such as email service) */
  availableInSubscriptions: SubscriptionName[]
}

export type BaseFeatureDescription = RoleFields & {
  deletion_warning?: string
  deprecated?: boolean
  deprecation_message?: string
  description?: string
  expires_at?: number

  flags?: ComponentFlag[]
  identifier: FeatureIdentifier
  marketing_url?: string
  name?: string
  no_expire?: boolean
  no_mobile?: boolean
  thumbnail_url?: string
  permission_name: PermissionName
}

export type ServerFeatureDescription = RoleFields & {
  name?: string
  identifier: FeatureIdentifier
  permission_name: PermissionName
}

export type ClientFeatureDescription = RoleFields & {
  identifier: FeatureIdentifier
  permission_name: PermissionName
  description: string
  name: string
}

export type ComponentFeatureDescription = BaseFeatureDescription & {
  /** The relative path of the index.html file or the main css file if theme, within the component folder itself */
  index_path: string
  content_type: ContentType
  area: ComponentArea
}

export type ThirdPartyFeatureDescription = ComponentFeatureDescription & {
  url: string
}

export type IframeComponentFeatureDescription = ComponentFeatureDescription & {
  component_permissions: ComponentPermission[]
}

export type EditorFeatureDescription = IframeComponentFeatureDescription & {
  file_type: 'txt' | 'html' | 'md' | 'json'
  /** Whether an editor is interchangable with another editor that has the same file_type */
  interchangeable: boolean
  note_type: NoteType
  spellcheckControl?: boolean
}

export type ThemeFeatureDescription = ComponentFeatureDescription & {
  /** Some themes can be layered on top of other themes */
  layerable?: boolean
  dock_icon?: ThemeDockIcon
  isDark?: boolean
}

export type FeatureDescription = BaseFeatureDescription &
  Partial<ComponentFeatureDescription & EditorFeatureDescription & ThemeFeatureDescription>
