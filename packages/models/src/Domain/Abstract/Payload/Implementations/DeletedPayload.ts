import { DeletedTransferPayload } from './../../TransferPayload/Interfaces/DeletedTransferPayload'
import { DeletedPayloadInterface } from '../Interfaces/DeletedPayload'
import { PayloadSource } from '../Types/PayloadSource'
import { PurePayload } from './PurePayload'
import { SyncResolvedParams, SyncResolvedPayload } from '../../../Runtime/Deltas/Utilities/SyncResolvedPayload'

export class DeletedPayload extends PurePayload<DeletedTransferPayload> implements DeletedPayloadInterface {
  override readonly deleted: true
  override readonly content: undefined

  constructor(rawPayload: DeletedTransferPayload, source = PayloadSource.Constructor) {
    super(rawPayload, source)

    this.deleted = true
    this.content = undefined
  }

  get discardable(): boolean | undefined {
    return !this.dirty
  }

  override ejected(): DeletedTransferPayload {
    return {
      ...super.ejected(),
      deleted: this.deleted,
      content: undefined,
    }
  }

  copy(override?: Partial<DeletedTransferPayload>, source = this.source): this {
    const result = new DeletedPayload(
      {
        ...this.ejected(),
        ...override,
      },
      source,
    )
    return result as this
  }

  copyAsSyncResolved(
    override?: Partial<DeletedTransferPayload> & SyncResolvedParams,
    source = this.source,
  ): SyncResolvedPayload {
    const result = new DeletedPayload(
      {
        ...this.ejected(),
        ...override,
      },
      source,
    )
    return result as SyncResolvedPayload
  }
}
