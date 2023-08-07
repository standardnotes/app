import { ComponentArea, ComponentPermission } from '@standardnotes/features'
import { ComponentPackageInfo } from './PackageInfo'
import { ItemContent } from '../../Abstract/Content/ItemContent'

export type ComponentContentSpecialized = {
  /** Items that have requested a component to be disabled in its context */
  disassociatedItemIds?: string[]

  /** Items that have requested a component to be enabled in its context */
  associatedItemIds?: string[]

  local_url?: string
  hosted_url?: string

  offlineOnly?: boolean
  name: string
  autoupdateDisabled?: boolean
  package_info: ComponentPackageInfo
  area: ComponentArea
  permissions?: ComponentPermission[]
  valid_until: Date | number

  legacy_url?: string
  isDeprecated?: boolean

  /** @deprecated */
  active?: boolean

  /** @deprecated */
  url?: string

  /**
   * @deprecated
   * Replaced with per-note component data stored in the note's ComponentDataDomain.
   */
  componentData?: Record<string, unknown>
}

export type ComponentContent = ItemContent & ComponentContentSpecialized
