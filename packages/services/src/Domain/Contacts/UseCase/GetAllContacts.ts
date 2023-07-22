import { TrustedContactInterface } from '@standardnotes/models'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { ContentType, Result, SyncUseCaseInterface } from '@standardnotes/domain-core'

export class GetAllContacts implements SyncUseCaseInterface<TrustedContactInterface[]> {
  constructor(private items: ItemManagerInterface) {}

  execute(): Result<TrustedContactInterface[]> {
    return Result.ok(this.items.getItems(ContentType.TYPES.TrustedContact))
  }
}
