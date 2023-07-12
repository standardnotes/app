import { FullyFormedPayloadInterface } from './../../../Abstract/Payload/Interfaces/UnionTypes'
import { UuidMap } from '@standardnotes/utils'
import { PayloadCollection } from './PayloadCollection'

export class ImmutablePayloadCollection<
  P extends FullyFormedPayloadInterface = FullyFormedPayloadInterface,
> extends PayloadCollection<P> {
  public get payloads(): P[] {
    return this.all()
  }

  /** We don't use a constructor for this because we don't want the constructor to have
   * side-effects, such as calling collection.set(). */
  static WithPayloads<T extends FullyFormedPayloadInterface>(payloads: T[] = []): ImmutablePayloadCollection<T> {
    const collection = new ImmutablePayloadCollection<T>()
    if (payloads.length > 0) {
      collection.set(payloads)
    }

    Object.freeze(collection)
    return collection
  }

  static FromCollection<T extends FullyFormedPayloadInterface>(
    collection: PayloadCollection<T>,
  ): ImmutablePayloadCollection<T> {
    const mapCopy = Object.freeze(Object.assign({}, collection.map))
    const typedMapCopy = Object.freeze(Object.assign({}, collection.typedMap))
    const referenceMapCopy = Object.freeze(collection.referenceMap.makeCopy()) as UuidMap
    const conflictMapCopy = Object.freeze(collection.conflictMap.makeCopy()) as UuidMap

    const result = new ImmutablePayloadCollection<T>(
      true,
      mapCopy,
      typedMapCopy as Partial<Record<string, T[]>>,
      referenceMapCopy,
      conflictMapCopy,
    )

    Object.freeze(result)

    return result
  }

  mutableCopy(): PayloadCollection<P> {
    const mapCopy = Object.assign({}, this.map)
    const typedMapCopy = Object.assign({}, this.typedMap)
    const referenceMapCopy = this.referenceMap.makeCopy()
    const conflictMapCopy = this.conflictMap.makeCopy()
    const result = new PayloadCollection(true, mapCopy, typedMapCopy, referenceMapCopy, conflictMapCopy)
    return result
  }
}
