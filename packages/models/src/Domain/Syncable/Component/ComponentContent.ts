import { ComponentArea, ComponentPermission } from '@standardnotes/features'
import { Uuid } from '@standardnotes/common'
import { ItemContent } from '../../Abstract/Content/ItemContent'
import { ComponentPackageInfo } from './PackageInfo'

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ComponentInterface {
  componentData: Record<string, any>

  /** Items that have requested a component to be disabled in its context */
  disassociatedItemIds: string[]

  /** Items that have requested a component to be enabled in its context */
  associatedItemIds: string[]

  local_url?: string
  hosted_url?: string

  /** @deprecated */
  url?: string

  offlineOnly: boolean
  name: string
  autoupdateDisabled: boolean
  package_info: ComponentPackageInfo
  area: ComponentArea
  permissions: ComponentPermission[]
  valid_until: Date | number
  active: boolean
  legacy_url?: string
  isMobileDefault: boolean
  isDeprecated: boolean
  isExplicitlyEnabledForItem(uuid: Uuid): boolean
}

export type ComponentContent = ComponentInterface & ItemContent
