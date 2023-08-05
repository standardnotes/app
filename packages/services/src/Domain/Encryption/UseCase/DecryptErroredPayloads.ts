import { DecryptErroredTypeAPayloads } from './TypeA/DecryptErroredPayloads'
import { ItemsEncryptionService } from './../../ItemsEncryption/ItemsEncryption'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'

export class DecryptErroredPayloads implements UseCaseInterface<void> {
  constructor(
    private itemsEncryption: ItemsEncryptionService,
    private _decryptErroredRootPayloads: DecryptErroredTypeAPayloads,
  ) {}

  async execute(): Promise<Result<void>> {
    await this._decryptErroredRootPayloads.execute()

    await this.itemsEncryption.decryptErroredItemPayloads()

    return Result.ok()
  }
}
