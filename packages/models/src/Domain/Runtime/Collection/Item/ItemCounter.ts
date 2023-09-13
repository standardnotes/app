import { removeFromArray } from '@standardnotes/utils'
import { isTag, SNTag } from '../../../Syncable/Tag/Tag'
import { SNIndex } from '../../Index/SNIndex'
import { ItemCollection } from './ItemCollection'
import { ItemDelta } from '../../Index/ItemDelta'
import { DecryptedItemInterface, isDecryptedItem, ItemInterface } from '../../../Abstract/Item'
import { CriteriaValidatorInterface } from '../../Display/Validator/CriteriaValidatorInterface'
import { CollectionCriteriaValidator } from '../../Display/Validator/CollectionCriteriaValidator'
import { ExcludeVaultsCriteriaValidator } from '../../Display/Validator/ExcludeVaultsCriteriaValidator'
import { ExclusiveVaultCriteriaValidator } from '../../Display/Validator/ExclusiveVaultCriteriaValidator'
import { HiddenContentCriteriaValidator } from '../../Display/Validator/HiddenContentCriteriaValidator'
import { CustomFilterCriteriaValidator } from '../../Display/Validator/CustomFilterCriteriaValidator'
import { AnyDisplayOptions, VaultDisplayOptions } from '../../Display'
import { isExclusionaryOptionsValue } from '../../Display/VaultDisplayOptionsTypes'
import { ContentType } from '@standardnotes/domain-core'

type AllNotesUuidSignifier = undefined
export type TagItemCountChangeObserver = (tagUuid: string | AllNotesUuidSignifier) => void

export class ItemCounter implements SNIndex {
  private tagToItemsMap: Partial<Record<string, Set<string>>> = {}
  private allCountableItems = new Set<string>()
  private countableItemsByType = new Map<string, Set<string>>()
  private displayOptions?: AnyDisplayOptions
  private vaultDisplayOptions?: VaultDisplayOptions

  constructor(
    private collection: ItemCollection,
    public observers: TagItemCountChangeObserver[] = [],
  ) {}

  public addCountChangeObserver(observer: TagItemCountChangeObserver): () => void {
    this.observers.push(observer)

    const thislessEventObservers = this.observers
    return () => {
      removeFromArray(thislessEventObservers, observer)
    }
  }

  public setDisplayOptions(options: AnyDisplayOptions) {
    this.displayOptions = options
    this.receiveItemChanges(this.collection.all())
  }

  public setVaultDisplayOptions(options: VaultDisplayOptions) {
    this.vaultDisplayOptions = options
    this.receiveItemChanges(this.collection.all())
  }

  public allCountableItemsCount(): number {
    return this.allCountableItems.size
  }

  public allCountableNotesCount(): number {
    return this.countableItemsByType.get(ContentType.TYPES.Note)?.size || 0
  }

  public allCountableFilesCount(): number {
    return this.countableItemsByType.get(ContentType.TYPES.File)?.size || 0
  }

  public countableItemsForTag(tag: SNTag): number {
    return this.tagToItemsMap[tag.uuid]?.size || 0
  }

  public onChange(delta: ItemDelta): void {
    const items = [...delta.changed, ...delta.inserted, ...delta.discarded].filter(
      (i) => i.content_type === ContentType.TYPES.Note || i.content_type === ContentType.TYPES.File,
    )
    const tags = [...delta.changed, ...delta.inserted].filter(isDecryptedItem).filter(isTag)

    this.receiveItemChanges(items)
    this.receiveTagChanges(tags)
  }

  private passesAllFilters(element: DecryptedItemInterface): boolean {
    if (!this.displayOptions) {
      return true
    }

    const filters: CriteriaValidatorInterface[] = [new CollectionCriteriaValidator(this.collection, element)]

    if (this.vaultDisplayOptions) {
      const options = this.vaultDisplayOptions.getOptions()
      if (isExclusionaryOptionsValue(options)) {
        filters.push(new ExcludeVaultsCriteriaValidator([...options.exclude, ...options.locked], element))
      } else {
        filters.push(new ExclusiveVaultCriteriaValidator(options.exclusive, element))
      }
    }

    if ('hiddenContentTypes' in this.displayOptions && this.displayOptions.hiddenContentTypes) {
      filters.push(new HiddenContentCriteriaValidator(this.displayOptions.hiddenContentTypes, element))
    }

    if ('customFilter' in this.displayOptions && this.displayOptions.customFilter) {
      filters.push(new CustomFilterCriteriaValidator(this.displayOptions.customFilter, element))
    }

    return filters.every((f) => f.passes())
  }

  private isItemCountable = (item: ItemInterface) => {
    if (isDecryptedItem(item)) {
      const passesFilters = this.passesAllFilters(item)
      return passesFilters && !item.archived && !item.trashed && !item.conflictOf
    }
    return false
  }

  private notifyObservers(tagUuid: string | undefined) {
    for (const observer of this.observers) {
      observer(tagUuid)
    }
  }

  private receiveTagChanges(tags: SNTag[]): void {
    for (const tag of tags) {
      const uuids = tag.references
        .filter((ref) => ref.content_type === ContentType.TYPES.Note || ref.content_type === ContentType.TYPES.File)
        .map((ref) => ref.uuid)
      const countableUuids = uuids.filter((uuid) => this.allCountableItems.has(uuid))
      const previousSet = this.tagToItemsMap[tag.uuid]
      this.tagToItemsMap[tag.uuid] = new Set(countableUuids)

      if (previousSet?.size !== countableUuids.length) {
        this.notifyObservers(tag.uuid)
      }
    }
  }

  private receiveItemChanges(items: ItemInterface[]): void {
    const previousAllCount = this.allCountableItems.size

    for (const item of items) {
      const isCountable = this.isItemCountable(item)

      if (isCountable) {
        this.allCountableItems.add(item.uuid)

        if (!this.countableItemsByType.has(item.content_type)) {
          this.countableItemsByType.set(item.content_type, new Set())
        }

        this.countableItemsByType.get(item.content_type)?.add(item.uuid)
      } else {
        this.allCountableItems.delete(item.uuid)
        this.countableItemsByType.get(item.content_type)?.delete(item.uuid)
      }

      const associatedTagUuids = this.collection.uuidsThatReferenceUuid(item.uuid)

      for (const tagUuid of associatedTagUuids) {
        const set = this.setForTag(tagUuid)
        const previousCount = set.size
        if (isCountable) {
          set.add(item.uuid)
        } else {
          set.delete(item.uuid)
        }
        if (previousCount !== set.size) {
          this.notifyObservers(tagUuid)
        }
      }
    }

    if (previousAllCount !== this.allCountableItems.size) {
      this.notifyObservers(undefined)
    }
  }

  private setForTag(uuid: string): Set<string> {
    let set = this.tagToItemsMap[uuid]
    if (!set) {
      set = new Set()
      this.tagToItemsMap[uuid] = set
    }
    return set
  }
}
