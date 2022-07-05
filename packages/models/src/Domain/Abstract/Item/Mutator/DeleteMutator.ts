import { DeletedPayload } from './../../Payload/Implementations/DeletedPayload'
import { DeletedPayloadInterface, PayloadInterface } from '../../Payload'
import { ItemInterface } from '../Interfaces/ItemInterface'
import { ItemMutator } from './ItemMutator'
import { MutationType } from '../Types/MutationType'
import { getIncrementedDirtyIndex } from '../../../Runtime/DirtyCounter/DirtyCounter'

export class DeleteItemMutator<
  I extends ItemInterface<PayloadInterface> = ItemInterface<PayloadInterface>,
> extends ItemMutator<PayloadInterface, I> {
  public getDeletedResult(): DeletedPayloadInterface {
    const dirtying = this.type !== MutationType.NonDirtying
    const result = new DeletedPayload(
      {
        ...this.immutablePayload.ejected(),
        deleted: true,
        content: undefined,
        dirty: dirtying ? true : this.immutablePayload.dirty,
        dirtyIndex: dirtying ? getIncrementedDirtyIndex() : this.immutablePayload.dirtyIndex,
      },
      this.immutablePayload.source,
    )

    return result
  }

  public override getResult(): PayloadInterface {
    throw Error('Must use getDeletedResult')
  }
}
