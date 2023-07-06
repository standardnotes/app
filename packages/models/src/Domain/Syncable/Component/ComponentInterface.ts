import { ComponentArea, ComponentPermission, FeatureIdentifier } from '@standardnotes/features'
import { ComponentPackageInfo } from './PackageInfo'
import { DecryptedItemInterface } from '../../Abstract/Item'
import { ComponentContent } from './ComponentContent'

export interface ComponentInterface extends DecryptedItemInterface<ComponentContent> {
  /** Items that have requested a component to be disabled in its context */
  disassociatedItemIds: string[]

  /** Items that have requested a component to be enabled in its context */
  associatedItemIds: string[]

  local_url?: string
  hosted_url?: string

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
  isExplicitlyEnabledForItem(uuid: string): boolean

  get identifier(): FeatureIdentifier
  get userPreferencesLookupKey(): string

  /** @deprecated */
  url?: string

  /**
   * @deprecated
   * Replaced with per-note component data stored in the note's ComponentDataDomain.
   */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  legacyComponentData: Record<string, any>
}
