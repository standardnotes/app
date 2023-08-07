import { ComponentArea, ComponentPermission, NoteType, ThirdPartyFeatureDescription } from '@standardnotes/features'
import { ComponentPackageInfo, ThemePackageInfo } from './PackageInfo'
import { DecryptedItemInterface } from '../../Abstract/Item'
import { ComponentContent } from './ComponentContent'

export interface ComponentInterface<P extends ComponentPackageInfo | ThemePackageInfo = ComponentPackageInfo>
  extends DecryptedItemInterface<ComponentContent> {
  /** Items that have requested a component to be disabled in its context */
  disassociatedItemIds: string[]

  /** Items that have requested a component to be enabled in its context */
  associatedItemIds: string[]

  local_url?: string
  hosted_url?: string

  offlineOnly: boolean
  name: string
  autoupdateDisabled: boolean
  package_info: P
  area: ComponentArea
  permissions: ComponentPermission[]
  valid_until: Date
  isDeprecated: boolean

  isExplicitlyEnabledForItem(uuid: string): boolean
  hasValidHostedUrl(): boolean

  isTheme(): boolean
  get layerableTheme(): boolean

  isExplicitlyDisabledForItem(uuid: string): boolean
  legacyIsDefaultEditor(): boolean

  get identifier(): string
  get noteType(): NoteType
  get displayName(): string
  get deprecationMessage(): string | undefined
  get thirdPartyPackageInfo(): ThirdPartyFeatureDescription
  get isExpired(): boolean

  /**
   * @deprecated
   * Replaced with active preferences managed by preferences service.
   */
  legacyActive: boolean

  /** @deprecated */
  legacy_url?: string

  /** @deprecated */
  url?: string

  /**
   * @deprecated
   * Replaced with per-note component data stored in the note's ComponentDataDomain.
   */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  legacyComponentData: Record<string, any>
}
