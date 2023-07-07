import { ComponentArea, ComponentPermission, FeatureIdentifier, NoteType } from '@standardnotes/features'
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
  valid_until: Date
  active: boolean
  legacy_url?: string
  isMobileDefault: boolean
  isDeprecated: boolean

  isExplicitlyEnabledForItem(uuid: string): boolean
  hasValidHostedUrl(): boolean
  isTheme(): boolean

  get identifier(): FeatureIdentifier
  get noteType(): NoteType
  get displayName(): string
  get deprecationMessage(): string | undefined

  /** @deprecated */
  url?: string

  /**
   * @deprecated
   * Replaced with per-note component data stored in the note's ComponentDataDomain.
   */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  legacyComponentData: Record<string, any>
}
