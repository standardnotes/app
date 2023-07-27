import { MutatorClientInterface } from './../../../Mutator/MutatorClientInterface'
import { ItemManagerInterface } from './../../../Item/ItemManagerInterface'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { ContentTypesUsingRootKeyEncryption } from '@standardnotes/models'

/**
 * When the user root key changes, we must re-encrypt all relevant items with this new root key (by simply re-syncing).
 */
export class ReencryptTypeAItems implements UseCaseInterface<void> {
  constructor(
    private items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
  ) {}

  public async execute(): Promise<Result<void>> {
    const items = this.items.getItems(ContentTypesUsingRootKeyEncryption())
    if (items.length > 0) {
      /**
       * Do not call sync after marking dirty.
       * Re-encrypting items keys is called by consumers who have specific flows who
       * will sync on their own timing
       */
      await this.mutator.setItemsDirty(items)
    }

    return Result.ok()
  }
}
