import { isValidUrl } from '@standardnotes/utils'
import {
  ThirdPartyFeatureDescription,
  ComponentArea,
  ComponentFlag,
  ComponentPermission,
  FindNativeFeature,
  NoteType,
  isEditorFeatureDescription,
} from '@standardnotes/features'
import { AppDataField } from '../../Abstract/Item/Types/AppDataField'
import { ComponentContent } from './ComponentContent'
import { ComponentInterface } from './ComponentInterface'
import { ConflictStrategy } from '../../Abstract/Item/Types/ConflictStrategy'
import { DecryptedItem } from '../../Abstract/Item/Implementations/DecryptedItem'
import { DecryptedPayloadInterface } from '../../Abstract/Payload/Interfaces/DecryptedPayload'
import { HistoryEntryInterface } from '../../Runtime/History'
import { ItemContent } from '../../Abstract/Content/ItemContent'
import { Predicate } from '../../Runtime/Predicate/Predicate'
import { DecryptedItemInterface } from './../../Abstract/Item/Interfaces/DecryptedItem'
import { ComponentPackageInfo, ThemePackageInfo } from './PackageInfo'
import { ContentType } from '@standardnotes/domain-core'

/**
 * Components are mostly iframe based extensions that communicate with the SN parent
 * via the postMessage API. However, a theme can also be a component, which is activated
 * only by its url.
 */
export class ComponentItem extends DecryptedItem<ComponentContent> implements ComponentInterface {
  public readonly legacyComponentData: Record<string, unknown>
  /** Items that have requested a component to be disabled in its context */
  public readonly disassociatedItemIds: string[]
  /** Items that have requested a component to be enabled in its context */
  public readonly associatedItemIds: string[]
  public readonly local_url?: string
  public readonly hosted_url?: string
  public readonly offlineOnly: boolean
  public readonly name: string
  public readonly autoupdateDisabled: boolean
  public readonly package_info: ComponentPackageInfo
  public readonly area: ComponentArea
  public readonly permissions: ComponentPermission[] = []
  public readonly valid_until: Date
  public readonly legacyActive: boolean
  public readonly legacy_url?: string

  constructor(payload: DecryptedPayloadInterface<ComponentContent>) {
    super(payload)

    if (payload.content.hosted_url && isValidUrl(payload.content.hosted_url)) {
      this.hosted_url = payload.content.hosted_url
    } else if (payload.content.url && isValidUrl(payload.content.url)) {
      this.hosted_url = payload.content.url
    } else if (payload.content.legacy_url && isValidUrl(payload.content.legacy_url)) {
      this.hosted_url = payload.content.legacy_url
    }
    this.local_url = payload.content.local_url

    this.valid_until = new Date(payload.content.valid_until || 0)
    this.offlineOnly = payload.content.offlineOnly ?? false
    this.name = payload.content.name

    if (this.content_type === ContentType.TYPES.Theme) {
      this.area = ComponentArea.Themes
    } else {
      this.area = payload.content.area
    }

    this.package_info = payload.content.package_info || {}
    this.permissions = payload.content.permissions || []
    this.autoupdateDisabled = payload.content.autoupdateDisabled ?? false
    this.disassociatedItemIds = payload.content.disassociatedItemIds || []
    this.associatedItemIds = payload.content.associatedItemIds || []

    /**
     * @legacy
     * We don't want to set this.url directly, as we'd like to phase it out.
     * If the content.url exists, we'll transfer it to legacy_url. We'll only
     * need to set this if content.hosted_url is blank, otherwise,
     * hosted_url is the url replacement.
     */
    this.legacy_url = !payload.content.hosted_url ? payload.content.url : undefined

    this.legacyComponentData = this.payload.content.componentData || {}

    this.legacyActive = payload.content.active ?? false
  }

  /** Do not duplicate components under most circumstances. Always keep original */
  public override strategyWhenConflictingWithItem(
    _item: DecryptedItemInterface,
    _previousRevision?: HistoryEntryInterface,
  ): ConflictStrategy {
    return ConflictStrategy.KeepBase
  }

  override get isSingleton(): boolean {
    return true
  }

  public get displayName(): string {
    return FindNativeFeature(this.identifier)?.name || this.name
  }

  public override singletonPredicate(): Predicate<ComponentItem> {
    const uniqueIdentifierPredicate = new Predicate<ComponentItem>('identifier', '=', this.identifier)
    return uniqueIdentifierPredicate
  }

  public isTheme(): boolean {
    return this.content_type === ContentType.TYPES.Theme || this.area === ComponentArea.Themes
  }

  /** @deprecated Use global application PrefKey.DefaultEditorIdentifier */
  public legacyIsDefaultEditor(): boolean {
    return this.getAppDomainValue(AppDataField.DefaultEditor) === true
  }

  public hasValidHostedUrl(): boolean {
    return (this.hosted_url || this.legacy_url) != undefined
  }

  public override contentKeysToIgnoreWhenCheckingEquality(): (keyof ItemContent)[] {
    const componentKeys: (keyof ComponentContent)[] = ['active', 'disassociatedItemIds', 'associatedItemIds']

    const superKeys = super.contentKeysToIgnoreWhenCheckingEquality()
    return [...componentKeys, ...superKeys] as (keyof ItemContent)[]
  }

  public isExplicitlyEnabledForItem(uuid: string): boolean {
    return this.associatedItemIds.indexOf(uuid) !== -1
  }

  public isExplicitlyDisabledForItem(uuid: string): boolean {
    return this.disassociatedItemIds.indexOf(uuid) !== -1
  }

  public get isExpired(): boolean {
    return this.valid_until.getTime() > 0 && this.valid_until <= new Date()
  }

  public get identifier(): string {
    return this.package_info.identifier
  }

  public get thirdPartyPackageInfo(): ThirdPartyFeatureDescription {
    return this.package_info as ThirdPartyFeatureDescription
  }

  public get noteType(): NoteType {
    if (isEditorFeatureDescription(this.package_info)) {
      return this.package_info.note_type ?? NoteType.Unknown
    }

    return NoteType.Unknown
  }

  public get isDeprecated(): boolean {
    let flags: string[] = this.package_info.flags ?? []
    flags = flags.map((flag: string) => flag.toLowerCase())
    return flags.includes(ComponentFlag.Deprecated)
  }

  public get deprecationMessage(): string | undefined {
    return this.package_info.deprecation_message
  }

  get layerableTheme(): boolean {
    if (!this.isTheme()) {
      return false
    }

    const themePackageInfo = this.package_info as ThemePackageInfo
    return themePackageInfo?.layerable ?? false
  }
}
