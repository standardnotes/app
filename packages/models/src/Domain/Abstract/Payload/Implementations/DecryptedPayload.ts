import { Copy } from '@standardnotes/utils'
import { SyncResolvedParams, SyncResolvedPayload } from '../../../Runtime/Deltas/Utilities/SyncResolvedPayload'
import { FillItemContent, ItemContent } from '../../Content/ItemContent'
import { ContentReference } from '../../Reference/ContentReference'
import { DecryptedTransferPayload } from '../../TransferPayload/Interfaces/DecryptedTransferPayload'
import { DecryptedPayloadInterface } from '../Interfaces/DecryptedPayload'
import { PayloadSource } from '../Types/PayloadSource'
import { PurePayload } from './PurePayload'

export class DecryptedPayload<
    C extends ItemContent = ItemContent,
    T extends DecryptedTransferPayload<C> = DecryptedTransferPayload<C>,
  >
  extends PurePayload<T>
  implements DecryptedPayloadInterface<C>
{
  override readonly content: C
  override readonly deleted: false

  constructor(rawPayload: T, source = PayloadSource.Constructor) {
    super(rawPayload, source)

    this.content = Copy(FillItemContent<C>(rawPayload.content))
    this.deleted = false
  }

  get references(): ContentReference[] {
    return this.content.references || []
  }

  public getReference(uuid: string): ContentReference {
    const result = this.references.find((ref) => ref.uuid === uuid)

    if (!result) {
      throw new Error('Reference not found')
    }

    return result
  }

  override ejected(): DecryptedTransferPayload<C> {
    return {
      ...super.ejected(),
      content: this.content,
      deleted: this.deleted,
    }
  }

  copy(override?: Partial<T>, source = this.source): this {
    const result = new DecryptedPayload(
      {
        ...this.ejected(),
        ...override,
      },
      source,
    )
    return result as this
  }

  copyAsSyncResolved(override?: Partial<T> & SyncResolvedParams, source = this.source): SyncResolvedPayload {
    const result = new DecryptedPayload(
      {
        ...this.ejected(),
        ...override,
      },
      source,
    )
    return result as SyncResolvedPayload
  }
}
