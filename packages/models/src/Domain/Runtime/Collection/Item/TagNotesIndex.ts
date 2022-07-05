import { removeFromArray } from '@standardnotes/utils'
import { ContentType, Uuid } from '@standardnotes/common'
import { isTag, SNTag } from '../../../Syncable/Tag/Tag'
import { SNIndex } from '../../Index/SNIndex'
import { ItemCollection } from './ItemCollection'
import { ItemDelta } from '../../Index/ItemDelta'
import { isDecryptedItem, ItemInterface } from '../../../Abstract/Item'

type AllNotesUuidSignifier = undefined
export type TagNoteCountChangeObserver = (tagUuid: Uuid | AllNotesUuidSignifier) => void

export class TagNotesIndex implements SNIndex {
  private tagToNotesMap: Partial<Record<Uuid, Set<Uuid>>> = {}
  private allCountableNotes = new Set<Uuid>()

  constructor(private collection: ItemCollection, public observers: TagNoteCountChangeObserver[] = []) {}

  private isNoteCountable = (note: ItemInterface) => {
    if (isDecryptedItem(note)) {
      return !note.archived && !note.trashed
    }
    return false
  }

  public addCountChangeObserver(observer: TagNoteCountChangeObserver): () => void {
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

  public allCountableNotesCount(): number {
    return this.allCountableNotes.size
  }

  public countableNotesForTag(tag: SNTag): number {
    return this.tagToNotesMap[tag.uuid]?.size || 0
  }

  public onChange(delta: ItemDelta): void {
    const notes = [...delta.changed, ...delta.inserted, ...delta.discarded].filter(
      (i) => i.content_type === ContentType.Note,
    )
    const tags = [...delta.changed, ...delta.inserted].filter(isDecryptedItem).filter(isTag)

    this.receiveNoteChanges(notes)
    this.receiveTagChanges(tags)
  }

  private receiveTagChanges(tags: SNTag[]): void {
    for (const tag of tags) {
      const uuids = tag.noteReferences.map((ref) => ref.uuid)
      const countableUuids = uuids.filter((uuid) => this.allCountableNotes.has(uuid))
      const previousSet = this.tagToNotesMap[tag.uuid]
      this.tagToNotesMap[tag.uuid] = new Set(countableUuids)

      if (previousSet?.size !== countableUuids.length) {
        this.notifyObservers(tag.uuid)
      }
    }
  }

  private receiveNoteChanges(notes: ItemInterface[]): void {
    const previousAllCount = this.allCountableNotes.size

    for (const note of notes) {
      const isCountable = this.isNoteCountable(note)
      if (isCountable) {
        this.allCountableNotes.add(note.uuid)
      } else {
        this.allCountableNotes.delete(note.uuid)
      }

      const associatedTagUuids = this.collection.uuidsThatReferenceUuid(note.uuid)

      for (const tagUuid of associatedTagUuids) {
        const set = this.setForTag(tagUuid)
        const previousCount = set.size
        if (isCountable) {
          set.add(note.uuid)
        } else {
          set.delete(note.uuid)
        }
        if (previousCount !== set.size) {
          this.notifyObservers(tagUuid)
        }
      }
    }

    if (previousAllCount !== this.allCountableNotes.size) {
      this.notifyObservers(undefined)
    }
  }

  private setForTag(uuid: Uuid): Set<Uuid> {
    let set = this.tagToNotesMap[uuid]
    if (!set) {
      set = new Set()
      this.tagToNotesMap[uuid] = set
    }
    return set
  }
}
