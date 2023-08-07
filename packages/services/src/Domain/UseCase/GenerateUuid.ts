import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'

export class GenerateUuid implements SyncUseCaseInterface<string> {
  constructor(private crypto: PureCryptoInterface) {}

  execute(): Result<string> {
    const uuid = this.crypto.generateUUID()

    return Result.ok(uuid)
  }
}
