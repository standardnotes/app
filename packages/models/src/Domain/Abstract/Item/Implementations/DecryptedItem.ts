import { dateToLocalizedString, useBoolean } from '@standardnotes/utils'
import { DecryptedTransferPayload } from './../../TransferPayload/Interfaces/DecryptedTransferPayload'
import { AppDataField } from '../Types/AppDataField'
import { ComponentDataDomain, DefaultAppDomain } from '../Types/DefaultAppDomain'
import { DecryptedItemInterface } from '../Interfaces/DecryptedItem'
import { DecryptedPayloadInterface } from '../../Payload/Interfaces/DecryptedPayload'
import { GenericItem } from './GenericItem'
import { ItemContent } from '../../Content/ItemContent'
import { ItemContentsEqual } from '../../../Utilities/Item/ItemContentsEqual'
import { PrefKey } from '../../../Syncable/UserPrefs/PrefKey'
import { ContentReference } from '../../Reference/ContentReference'

export class DecryptedItem<C extends ItemContent = ItemContent>
  extends GenericItem<DecryptedPayloadInterface<C>>
  implements DecryptedItemInterface<C>
{
  public readonly conflictOf?: string
  public readonly protected: boolean = false
  public readonly trashed: boolean = false
  public readonly pinned: boolean = false
  public readonly archived: boolean = false
  public readonly locked: boolean = false
  public readonly starred: boolean = false

  constructor(payload: DecryptedPayloadInterface<C>) {
    super(payload)

    const userModVal = this.getAppDomainValueWithDefault(AppDataField.UserModifiedDate, this.serverUpdatedAt || 0)
    this.userModifiedDate = new Date(userModVal as number | Date)

    this.conflictOf = payload.content.conflict_of
    this.updatedAtString = dateToLocalizedString(this.userModifiedDate)
    this.protected = useBoolean(this.payload.content.protected, false)
    this.trashed = useBoolean(this.payload.content.trashed, false)
    this.starred = useBoolean(this.payload.content.starred, false)
    this.pinned = this.getAppDomainValueWithDefault(AppDataField.Pinned, false)
    this.archived = this.getAppDomainValueWithDefault(AppDataField.Archived, false)
    this.locked = this.getAppDomainValueWithDefault(AppDataField.Locked, false)
  }

  public static DefaultAppDomain() {
    return DefaultAppDomain
  }

  get content() {
    return this.payload.content
  }

  get references(): ContentReference[] {
    return this.payload.content.references || []
  }

  public isReferencingItem(item: { uuid: string }): boolean {
    return this.references.find((r) => r.uuid === item.uuid) != undefined
  }

  /**
   * Inside of content is a record called `appData` (which should have been called `domainData`).
   * It was named `appData` as a way to indicate that it can house data for multiple apps.
   * Each key of appData is a domain string, which was originally designed
   * to allow for multiple 3rd party apps who share access to the same data to store data
   * in an isolated location. This design premise is antiquited and no longer pursued,
   * however we continue to use it as not to uncesesarily create a large data migration
   * that would require users to sync all their data.
   *
   * domainData[DomainKey] will give you another Record<string, any>.
   *
   * Currently appData['org.standardnotes.sn'] returns an object of type AppData.
   * And appData['org.standardnotes.sn.components] returns an object of type ComponentData
   */
  public getDomainData(
    domain: typeof ComponentDataDomain | typeof DefaultAppDomain,
  ): undefined | Record<string, unknown> {
    const domainData = this.payload.content.appData
    if (!domainData) {
      return undefined
    }
    const data = domainData[domain]
    return data
  }

  public getAppDomainValue<T>(key: AppDataField | PrefKey): T | undefined {
    const appData = this.getDomainData(DefaultAppDomain)
    return appData?.[key] as T
  }

  public getAppDomainValueWithDefault<T, D extends T>(key: AppDataField | PrefKey, defaultValue: D): T {
    const appData = this.getDomainData(DefaultAppDomain)
    return (appData?.[key] as T) || defaultValue
  }

  public override payloadRepresentation(override?: Partial<DecryptedTransferPayload<C>>): DecryptedPayloadInterface<C> {
    return this.payload.copy(override)
  }

  /**
   * During sync conflicts, when determing whether to create a duplicate for an item,
   * we can omit keys that have no meaningful weight and can be ignored. For example,
   * if one component has active = true and another component has active = false,
   * it would be needless to duplicate them, so instead we ignore that value.
   */
  public contentKeysToIgnoreWhenCheckingEquality<C extends ItemContent = ItemContent>(): (keyof C)[] {
    return ['conflict_of']
  }

  /** Same as `contentKeysToIgnoreWhenCheckingEquality`, but keys inside appData[Item.AppDomain] */
  public appDataContentKeysToIgnoreWhenCheckingEquality(): AppDataField[] {
    return [AppDataField.UserModifiedDate]
  }

  public getContentCopy() {
    return JSON.parse(JSON.stringify(this.content))
  }

  public isItemContentEqualWith(otherItem: DecryptedItemInterface) {
    return ItemContentsEqual(
      this.payload.content,
      otherItem.payload.content,
      this.contentKeysToIgnoreWhenCheckingEquality(),
      this.appDataContentKeysToIgnoreWhenCheckingEquality(),
    )
  }
}
