import { isNote } from './../../../Syncable/Note/Note'
import { removeFromArray } from '@standardnotes/utils'
import { ContentType, Uuid } from '@standardnotes/common'
import { isTag, SNTag } from '../../../Syncable/Tag/Tag'
import { SNIndex } from '../../Index/SNIndex'
import { ItemCollection } from './ItemCollection'
import { ItemDelta } from '../../Index/ItemDelta'
import { isDecryptedItem, ItemInterface } from '../../../Abstract/Item'

type AllNotesUuidSignifier = undefined
export type TagItemCountChangeObserver = (tagUuid: Uuid | AllNotesUuidSignifier) => void

export class TagItemsIndex implements SNIndex {
  private tagToItemsMap: Partial<Record<Uuid, Set<Uuid>>> = {}
  private allCountableItems = new Set<Uuid>()
  private allCountableNotes = new Set<Uuid>()

  constructor(private collection: ItemCollection, public observers: TagItemCountChangeObserver[] = []) {}

  private isItemCountable = (item: ItemInterface) => {
    if (isDecryptedItem(item)) {
      return !item.archived && !item.trashed
    }
    return false
  }

  public addCountChangeObserver(observer: TagItemCountChangeObserver): () => void {
    this.observers.push(observer)

    const thislessEventObservers = this.observers
    return () => {
      removeFromArray(thislessEventObservers, observer)
    }
  }

  private notifyObservers(tagUuid: Uuid | undefined) {
    for (const observer of this.observers) {
      observer(tagUuid)
    }
  }

  public allCountableItemsCount(): number {
    return this.allCountableItems.size
  }

  public allCountableNotesCount(): number {
    return this.allCountableNotes.size
  }

  public countableItemsForTag(tag: SNTag): number {
    return this.tagToItemsMap[tag.uuid]?.size || 0
  }

  public onChange(delta: ItemDelta): void {
    const items = [...delta.changed, ...delta.inserted, ...delta.discarded].filter(
      (i) => i.content_type === ContentType.Note || i.content_type === ContentType.File,
    )
    const tags = [...delta.changed, ...delta.inserted].filter(isDecryptedItem).filter(isTag)

    this.receiveItemChanges(items)
    this.receiveTagChanges(tags)
  }

  private receiveTagChanges(tags: SNTag[]): void {
    for (const tag of tags) {
      const uuids = tag.references
        .filter((ref) => ref.content_type === ContentType.Note || ref.content_type === ContentType.File)
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

        if (isNote(item)) {
          this.allCountableNotes.add(item.uuid)
        }
      } else {
        this.allCountableItems.delete(item.uuid)

        if (isNote(item)) {
          this.allCountableNotes.delete(item.uuid)
        }
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

  private setForTag(uuid: Uuid): Set<Uuid> {
    let set = this.tagToItemsMap[uuid]
    if (!set) {
      set = new Set()
      this.tagToItemsMap[uuid] = set
    }
    return set
  }
}
