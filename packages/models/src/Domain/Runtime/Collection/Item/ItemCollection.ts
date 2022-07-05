import { ItemContent } from './../../../Abstract/Content/ItemContent'
import { EncryptedItemInterface } from './../../../Abstract/Item/Interfaces/EncryptedItem'
import { ContentType, Uuid } from '@standardnotes/common'
import { SNIndex } from '../../Index/SNIndex'
import { isDecryptedItem } from '../../../Abstract/Item/Interfaces/TypeCheck'
import { DecryptedItemInterface } from '../../../Abstract/Item/Interfaces/DecryptedItem'
import { CollectionInterface } from '../CollectionInterface'
import { DeletedItemInterface } from '../../../Abstract/Item'
import { Collection } from '../Collection'
import { AnyItemInterface } from '../../../Abstract/Item/Interfaces/UnionTypes'
import { ItemDelta } from '../../Index/ItemDelta'

export class ItemCollection
  extends Collection<AnyItemInterface, DecryptedItemInterface, EncryptedItemInterface, DeletedItemInterface>
  implements SNIndex, CollectionInterface
{
  public onChange(delta: ItemDelta): void {
    const changedOrInserted = delta.changed.concat(delta.inserted)

    if (changedOrInserted.length > 0) {
      this.set(changedOrInserted)
    }

    this.discard(delta.discarded)
  }

  public findDecrypted<T extends DecryptedItemInterface = DecryptedItemInterface>(uuid: Uuid): T | undefined {
    const result = this.find(uuid)

    if (!result) {
      return undefined
    }

    return isDecryptedItem(result) ? (result as T) : undefined
  }

  public findAllDecrypted<T extends DecryptedItemInterface = DecryptedItemInterface>(uuids: Uuid[]): T[] {
    return this.findAll(uuids).filter(isDecryptedItem) as T[]
  }

  public findAllDecryptedWithBlanks<C extends ItemContent = ItemContent>(
    uuids: Uuid[],
  ): (DecryptedItemInterface<C> | undefined)[] {
    const results = this.findAllIncludingBlanks(uuids)
    const mapped = results.map((i) => {
      if (i == undefined || isDecryptedItem(i)) {
        return i
      }

      return undefined
    })

    return mapped as (DecryptedItemInterface<C> | undefined)[]
  }

  public allDecrypted<T extends DecryptedItemInterface>(contentType: ContentType | ContentType[]): T[] {
    return this.all(contentType).filter(isDecryptedItem) as T[]
  }
}
