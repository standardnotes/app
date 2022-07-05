import { UuidMap } from '@standardnotes/utils'

export interface CollectionInterface {
  /** Maintains an index where the direct map for each item id is an array
   * of item ids that the item references. This is essentially equivalent to
   * item.content.references, but keeps state even when the item is deleted.
   * So if tag A references Note B, referenceMap.directMap[A.uuid] == [B.uuid].
   * The inverse map for each item is an array of item ids where the items reference the
   * key item. So if tag A references Note B, referenceMap.inverseMap[B.uuid] == [A.uuid].
   * This allows callers to determine for a given item, who references it?
   * It would be prohibitive to look this up on demand */
  readonly referenceMap: UuidMap
}
