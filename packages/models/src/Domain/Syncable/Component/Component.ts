import { isValidUrl } from '@standardnotes/utils'
import { ContentType, Uuid } from '@standardnotes/common'
import {
  FeatureIdentifier,
  ThirdPartyFeatureDescription,
  ComponentArea,
  ComponentFlag,
  ComponentPermission,
  FindNativeFeature,
  NoteType,
} from '@standardnotes/features'
import { AppDataField } from '../../Abstract/Item/Types/AppDataField'
import { ComponentContent, ComponentInterface } from './ComponentContent'
import { ConflictStrategy } from '../../Abstract/Item/Types/ConflictStrategy'
import { DecryptedItem } from '../../Abstract/Item/Implementations/DecryptedItem'
import { DecryptedPayloadInterface } from '../../Abstract/Payload/Interfaces/DecryptedPayload'
import { HistoryEntryInterface } from '../../Runtime/History'
import { ItemContent } from '../../Abstract/Content/ItemContent'
import { Predicate } from '../../Runtime/Predicate/Predicate'
import { ItemInterface } from '../../Abstract/Item/Interfaces/ItemInterface'
import { DecryptedItemInterface } from './../../Abstract/Item/Interfaces/DecryptedItem'
import { ComponentPackageInfo } from './PackageInfo'

export const isComponent = (x: ItemInterface): x is SNComponent => x.content_type === ContentType.Component

export const isComponentOrTheme = (x: ItemInterface): x is SNComponent =>
  x.content_type === ContentType.Component || x.content_type === ContentType.Theme

/**
 * Components are mostly iframe based extensions that communicate with the SN parent
 * via the postMessage API. However, a theme can also be a component, which is activated
 * only by its url.
 */
export class SNComponent extends DecryptedItem<ComponentContent> implements ComponentInterface {
  public readonly componentData: Record<string, unknown>
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
  public readonly active: boolean
  public readonly legacy_url?: string
  public readonly isMobileDefault: boolean

  constructor(payload: DecryptedPayloadInterface<ComponentContent>) {
    super(payload)
    /** Custom data that a component can store in itself */
    this.componentData = this.payload.content.componentData || {}

    if (payload.content.hosted_url && isValidUrl(payload.content.hosted_url)) {
      this.hosted_url = payload.content.hosted_url
    } else if (payload.content.url && isValidUrl(payload.content.url)) {
      this.hosted_url = payload.content.url
    } else if (payload.content.legacy_url && isValidUrl(payload.content.legacy_url)) {
      this.hosted_url = payload.content.legacy_url
    }
    this.local_url = payload.content.local_url

    this.valid_until = new Date(payload.content.valid_until || 0)
    this.offlineOnly = payload.content.offlineOnly
    this.name = payload.content.name
    this.area = payload.content.area
    this.package_info = payload.content.package_info || {}
    this.permissions = payload.content.permissions || []
    this.active = payload.content.active
    this.autoupdateDisabled = payload.content.autoupdateDisabled
    this.disassociatedItemIds = payload.content.disassociatedItemIds || []
    this.associatedItemIds = payload.content.associatedItemIds || []
    this.isMobileDefault = payload.content.isMobileDefault
    /**
     * @legacy
     * We don't want to set this.url directly, as we'd like to phase it out.
     * If the content.url exists, we'll transfer it to legacy_url. We'll only
     * need to set this if content.hosted_url is blank, otherwise,
     * hosted_url is the url replacement.
     */
    this.legacy_url = !payload.content.hosted_url ? payload.content.url : undefined
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

  public override singletonPredicate(): Predicate<SNComponent> {
    const uniqueIdentifierPredicate = new Predicate<SNComponent>('identifier', '=', this.identifier)
    return uniqueIdentifierPredicate
  }

  public isEditor(): boolean {
    return this.area === ComponentArea.Editor
  }

  public isTheme(): boolean {
    return this.content_type === ContentType.Theme || this.area === ComponentArea.Themes
  }

  public isDefaultEditor(): boolean {
    return this.getAppDomainValue(AppDataField.DefaultEditor) === true
  }

  public getLastSize(): unknown {
    return this.getAppDomainValue(AppDataField.LastSize)
  }

  /**
   * The key used to look up data that this component may have saved to an item.
   * This data will be stored on the item using this key.
   */
  public getClientDataKey(): string {
    if (this.legacy_url) {
      return this.legacy_url
    } else {
      return this.uuid
    }
  }

  public hasValidHostedUrl(): boolean {
    return (this.hosted_url || this.legacy_url) != undefined
  }

  public override contentKeysToIgnoreWhenCheckingEquality(): (keyof ItemContent)[] {
    const componentKeys: (keyof ComponentContent)[] = ['active', 'disassociatedItemIds', 'associatedItemIds']

    const superKeys = super.contentKeysToIgnoreWhenCheckingEquality()
    return [...componentKeys, ...superKeys] as (keyof ItemContent)[]
  }

  /**
   * An associative component depends on being explicitly activated for a
   * given item, compared to a dissaciative component, which is enabled by
   * default in areas unrelated to a certain item.
   */
  public static associativeAreas(): ComponentArea[] {
    return [ComponentArea.Editor]
  }

  public isAssociative(): boolean {
    return SNComponent.associativeAreas().includes(this.area)
  }

  public isExplicitlyEnabledForItem(uuid: Uuid): boolean {
    return this.associatedItemIds.indexOf(uuid) !== -1
  }

  public isExplicitlyDisabledForItem(uuid: Uuid): boolean {
    return this.disassociatedItemIds.indexOf(uuid) !== -1
  }

  public get isExpired(): boolean {
    return this.valid_until.getTime() > 0 && this.valid_until <= new Date()
  }

  public get identifier(): FeatureIdentifier {
    return this.package_info.identifier
  }

  public get thirdPartyPackageInfo(): ThirdPartyFeatureDescription {
    return this.package_info as ThirdPartyFeatureDescription
  }

  public get noteType(): NoteType {
    return this.package_info.note_type || NoteType.Plain
  }

  public get isDeprecated(): boolean {
    let flags: string[] = this.package_info.flags ?? []
    flags = flags.map((flag: string) => flag.toLowerCase())
    return flags.includes(ComponentFlag.Deprecated)
  }

  public get deprecationMessage(): string | undefined {
    return this.package_info.deprecation_message
  }
}
