import { SyncOptions } from './../Sync/SyncOptions'
import { MutatorClientInterface } from './../Mutator/MutatorClientInterface'
import { SyncServiceInterface } from './../Sync/SyncServiceInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { DecryptedItemInterface, DecryptedItemMutator, MutationType, PayloadEmitSource } from '@standardnotes/models'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'

export class ChangeAndSaveItem implements UseCaseInterface<DecryptedItemInterface | undefined> {
  constructor(
    private readonly items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private sync: SyncServiceInterface,
  ) {}

  async execute<M extends DecryptedItemMutator = DecryptedItemMutator>(
    itemToLookupUuidFor: DecryptedItemInterface,
    mutate: (mutator: M) => void,
    updateTimestamps = true,
    emitSource?: PayloadEmitSource,
    syncOptions?: SyncOptions,
  ): Promise<Result<DecryptedItemInterface | undefined>> {
    await this.mutator.changeItems(
      [itemToLookupUuidFor],
      mutate,
      updateTimestamps ? MutationType.UpdateUserTimestamps : MutationType.NoUpdateUserTimestamps,
      emitSource,
    )

    await this.sync.sync(syncOptions)

    return Result.ok(this.items.findItem(itemToLookupUuidFor.uuid))
  }
}
