import { DecryptedItemInterface } from './../../Abstract/Item/Interfaces/DecryptedItem'
import { ThirdPartyFeatureDescription } from '@standardnotes/features'
import { DecryptedItem } from '../../Abstract/Item/Implementations/DecryptedItem'
import { ItemContent } from '../../Abstract/Content/ItemContent'
import { ConflictStrategy } from '../../Abstract/Item/Types/ConflictStrategy'
import { DecryptedPayloadInterface } from '../../Abstract/Payload/Interfaces/DecryptedPayload'
import { HistoryEntryInterface } from '../../Runtime/History/HistoryEntryInterface'
import { Action } from './Types'
import { ComponentPackageInfo } from '../Component/PackageInfo'

export interface ActionExtensionInterface {
  actions: Action[]
  deprecation?: string
  description: string
  hosted_url?: string
  name: string
  package_info: ComponentPackageInfo
  supported_types: string[]
  url: string
}

export type ActionExtensionContent = ActionExtensionInterface & ItemContent

/**
 * Related to the SNActionsService and the local Action model.
 */
export class SNActionsExtension extends DecryptedItem<ActionExtensionContent> {
  public readonly actions: Action[] = []
  public readonly description: string
  public readonly url: string
  public readonly supported_types: string[]
  public readonly deprecation?: string
  public readonly name: string
  public readonly package_info: ComponentPackageInfo

  constructor(payload: DecryptedPayloadInterface<ActionExtensionContent>) {
    super(payload)
    this.name = payload.content.name || ''
    this.description = payload.content.description || ''
    this.url = payload.content.hosted_url || payload.content.url
    this.supported_types = payload.content.supported_types
    this.package_info = this.payload.content.package_info || {}
    this.deprecation = payload.content.deprecation
    this.actions = payload.content.actions
  }

  public get displayName(): string {
    return this.name
  }

  public get thirdPartyPackageInfo(): ThirdPartyFeatureDescription {
    return this.package_info as ThirdPartyFeatureDescription
  }

  public get isListedExtension(): boolean {
    return (this.package_info.identifier as string) === 'org.standardnotes.listed'
  }

  actionsWithContextForItem(item: DecryptedItemInterface): Action[] {
    return this.actions.filter((action) => {
      return action.context === item.content_type || action.context === 'Item'
    })
  }

  /** Do not duplicate. Always keep original */
  override strategyWhenConflictingWithItem(
    _item: DecryptedItemInterface,
    _previousRevision?: HistoryEntryInterface,
  ): ConflictStrategy {
    return ConflictStrategy.KeepBase
  }
}
