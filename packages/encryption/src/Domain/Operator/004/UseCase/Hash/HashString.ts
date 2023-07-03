import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { HashingKey } from './HashingKey'

export class HashStringUseCase {
  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(string: string, hashingKey: HashingKey): string {
    return this.crypto.sodiumCryptoGenericHash(string, hashingKey.key)
  }
}
