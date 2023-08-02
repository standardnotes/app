import { extendArray, isObject, isString, UuidMap } from '@standardnotes/utils'
import { remove } from 'lodash'
import { ItemContent } from '../../Abstract/Content/ItemContent'
import { ContentReference } from '../../Abstract/Item'

export interface CollectionElement {
  uuid: string
  content_type: string
  dirty?: boolean
  deleted?: boolean
}

export interface DecryptedCollectionElement<C extends ItemContent = ItemContent> extends CollectionElement {
  content: C
  references: ContentReference[]
}

export interface DeletedCollectionElement extends CollectionElement {
  content: undefined
  deleted: true
}

export interface EncryptedCollectionElement extends CollectionElement {
  content: string
  errorDecrypting: boolean
}

export abstract class Collection<
  Element extends Decrypted | Encrypted | Deleted,
  Decrypted extends DecryptedCollectionElement,
  Encrypted extends EncryptedCollectionElement,
  Deleted extends DeletedCollectionElement,
> {
  readonly map: Partial<Record<string, Element>> = {}
  readonly typedMap: Partial<Record<string, Element[]>> = {}

  /** An array of uuids of items that are dirty */
  dirtyIndex: Set<string> = new Set()

  /** An array of uuids of items that are not marked as deleted */
  nondeletedIndex: Set<string> = new Set()

  /** An array of uuids of items that are errorDecrypting or waitingForKey */
  invalidsIndex: Set<string> = new Set()

  readonly referenceMap: UuidMap

  /** Maintains an index for each item uuid where the value is an array of uuids that are
   * conflicts of that item. So if Note B and C are conflicts of Note A,
   * conflictMap[A.uuid] == [B.uuid, C.uuid] */
  readonly conflictMap: UuidMap

  isDecryptedElement = (e: Decrypted | Encrypted | Deleted): e is Decrypted => {
    return isObject(e.content)
  }

  isEncryptedElement = (e: Decrypted | Encrypted | Deleted): e is Encrypted => {
    return 'content' in e && isString(e.content)
  }

  isErrorDecryptingElement = (e: Decrypted | Encrypted | Deleted): e is Encrypted => {
    return this.isEncryptedElement(e)
  }

  isDeletedElement = (e: Decrypted | Encrypted | Deleted): e is Deleted => {
    return 'deleted' in e && e.deleted === true
  }

  isNonDeletedElement = (e: Decrypted | Encrypted | Deleted): e is Decrypted | Encrypted => {
    return !this.isDeletedElement(e)
  }

  constructor(
    copy = false,
    mapCopy?: Partial<Record<string, Element>>,
    typedMapCopy?: Partial<Record<string, Element[]>>,
    referenceMapCopy?: UuidMap,
    conflictMapCopy?: UuidMap,
  ) {
    if (copy) {
      this.map = mapCopy as Record<string, Element>
      this.typedMap = typedMapCopy as Record<string, Element[]>
      this.referenceMap = referenceMapCopy as UuidMap
      this.conflictMap = conflictMapCopy as UuidMap
    } else {
      this.referenceMap = new UuidMap()
      this.conflictMap = new UuidMap()
    }
  }

  public uuids(): string[] {
    return Object.keys(this.map)
  }

  public all(contentType?: string | string[]): Element[] {
    if (contentType) {
      if (Array.isArray(contentType)) {
        const elements: Element[] = []
        for (const type of contentType) {
          extendArray(elements, this.typedMap[type] || [])
        }
        return elements
      } else {
        return this.typedMap[contentType]?.slice() || []
      }
    } else {
      return Object.keys(this.map).map((uuid: string) => {
        return this.map[uuid]
      }) as Element[]
    }
  }

  /** Returns all elements that are not marked as deleted */
  public nondeletedElements(): Element[] {
    const uuids = Array.from(this.nondeletedIndex)
    return this.findAll(uuids).filter(this.isNonDeletedElement)
  }

  /** Returns all elements that are errorDecrypting or waitingForKey */
  public invalidElements(): Encrypted[] {
    const uuids = Array.from(this.invalidsIndex)
    return this.findAll(uuids) as unknown as Encrypted[]
  }

  /** Returns all elements that are marked as dirty */
  public dirtyElements(): Element[] {
    const uuids = Array.from(this.dirtyIndex)
    return this.findAll(uuids)
  }

  public findAll(uuids: string[]): Element[] {
    const results: Element[] = []

    for (const id of uuids) {
      const element = this.map[id]
      if (element) {
        results.push(element)
      }
    }

    return results
  }

  public find(uuid: string): Element | undefined {
    return this.map[uuid]
  }

  public has(uuid: string): boolean {
    return this.find(uuid) != undefined
  }

  /**
   * If an item is not found, an `undefined` element
   * will be inserted into the array.
   */
  public findAllIncludingBlanks<E extends Element>(uuids: string[]): (E | Deleted | undefined)[] {
    const results: (E | Deleted | undefined)[] = []

    for (const id of uuids) {
      const element = this.map[id] as E | Deleted | undefined
      results.push(element)
    }

    return results
  }

  public set(elements: Element | Element[]): void {
    elements = Array.isArray(elements) ? elements : [elements]

    if (elements.length === 0) {
      console.warn('Attempting to set 0 elements onto collection')
      return
    }

    for (const element of elements) {
      this.map[element.uuid] = element
      this.setToTypedMap(element)

      if (this.isErrorDecryptingElement(element)) {
        this.invalidsIndex.add(element.uuid)
      } else {
        this.invalidsIndex.delete(element.uuid)
      }

      if (this.isDecryptedElement(element)) {
        const conflictOf = element.content.conflict_of

        if (conflictOf && !element.content.trashed) {
          this.conflictMap.establishRelationship(conflictOf, element.uuid)
        }

        const isConflictOfButTrashed = conflictOf && element.content.trashed

        const isInConflictMapButIsNotConflictOf =
          !conflictOf && this.conflictMap.getInverseRelationships(element.uuid).length > 0

        const isInConflictMapButDoesNotHaveConflicts =
          this.conflictMap.existsInDirectMap(element.uuid) &&
          this.conflictMap.getDirectRelationships(element.uuid).length === 0

        if (isInConflictMapButIsNotConflictOf || isInConflictMapButDoesNotHaveConflicts || isConflictOfButTrashed) {
          this.conflictMap.removeFromMap(element.uuid)
        }

        this.referenceMap.setAllRelationships(
          element.uuid,
          element.references.map((r) => r.uuid),
        )
      }

      if (element.dirty) {
        this.dirtyIndex.add(element.uuid)
      } else {
        this.dirtyIndex.delete(element.uuid)
      }

      if (element.deleted) {
        this.nondeletedIndex.delete(element.uuid)
        if (this.conflictMap.existsInDirectMap(element.uuid) || this.conflictMap.existsInInverseMap(element.uuid)) {
          this.conflictMap.removeFromMap(element.uuid)
        }
      } else {
        this.nondeletedIndex.add(element.uuid)
      }
    }
  }

  public discard(elements: Element | Element[]): void {
    elements = Array.isArray(elements) ? elements : [elements]
    for (const element of elements) {
      this.deleteFromTypedMap(element)
      delete this.map[element.uuid]
      this.conflictMap.removeFromMap(element.uuid)
      this.referenceMap.removeFromMap(element.uuid)
    }
  }

  public uuidReferencesForUuid(uuid: string): string[] {
    return this.referenceMap.getDirectRelationships(uuid)
  }

  public uuidsThatReferenceUuid(uuid: string): string[] {
    return this.referenceMap.getInverseRelationships(uuid)
  }

  public referencesForElement(element: Decrypted): Element[] {
    const uuids = this.referenceMap.getDirectRelationships(element.uuid)
    return this.findAll(uuids)
  }

  public conflictsOf(uuid: string): Element[] {
    const uuids = this.conflictMap.getDirectRelationships(uuid)
    return this.findAll(uuids)
  }

  public elementsReferencingElement(element: Decrypted, contentType?: string): Element[] {
    const uuids = this.uuidsThatReferenceUuid(element.uuid)
    const items = this.findAll(uuids)

    if (!contentType) {
      return items
    }

    return items.filter((item) => item.content_type === contentType)
  }

  private setToTypedMap(element: Element): void {
    const array = this.typedMap[element.content_type] || []
    remove(array, { uuid: element.uuid as never })
    array.push(element)
    this.typedMap[element.content_type] = array
  }

  private deleteFromTypedMap(element: Element): void {
    const array = this.typedMap[element.content_type] || []
    remove(array, { uuid: element.uuid as never })
    this.typedMap[element.content_type] = array
  }

  public uuidsOfItemsWithConflicts(): string[] {
    return this.conflictMap.getAllDirectKeys()
  }
}
