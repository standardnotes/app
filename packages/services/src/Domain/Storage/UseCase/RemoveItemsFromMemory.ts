import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { StorageServiceInterface } from '../StorageServiceInterface'
import { CreatePayload, DecryptedItemInterface, PayloadEmitSource, PayloadSource } from '@standardnotes/models'
import { Uuids } from '@standardnotes/utils'
import { PayloadManagerInterface } from '../../Payloads/PayloadManagerInterface'

export class RemoveItemsFromMemory implements UseCaseInterface<void> {
  constructor(
    private storage: StorageServiceInterface,
    private items: ItemManagerInterface,
    private payloads: PayloadManagerInterface,
  ) {}

  async execute(items: DecryptedItemInterface[]): Promise<Result<void>> {
    this.items.removeItemsFromMemory(items)

    const rawPayloads = await this.storage.getRawPayloads(Uuids(items))

    const encryptedPayloads = rawPayloads.map((payload) => CreatePayload(payload, PayloadSource.LocalDatabaseLoaded))

    await this.payloads.emitPayloads(encryptedPayloads, PayloadEmitSource.LocalDatabaseLoaded)

    return Result.ok()
  }
}
