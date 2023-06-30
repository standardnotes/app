import { PureCryptoInterface } from '@standardnotes/sncrypto-common'

export class ParseConsistentBase64JsonPayloadUseCase {
  constructor(private readonly crypto: PureCryptoInterface) {}

  execute<P>(stringifiedData: string): P {
    return JSON.parse(this.crypto.base64Decode(stringifiedData))
  }
}
