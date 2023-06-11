import { Base64String, PureCryptoInterface } from '@standardnotes/sncrypto-common'
import * as Utils from '@standardnotes/utils'

export class CreateConsistentBase64JsonPayloadUseCase {
  constructor(private readonly crypto: PureCryptoInterface) {}

  execute<T>(jsonObject: T): Base64String {
    return this.crypto.base64Encode(JSON.stringify(Utils.sortedCopy(Utils.omitUndefinedCopy(jsonObject))))
  }
}
