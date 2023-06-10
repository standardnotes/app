import { PureCryptoInterface } from '@standardnotes/sncrypto-common'

export class HashStringUseCase {
  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(string: string, key: string): string {
    return this.crypto.sodiumCryptoGenericHash(string, key)
  }
}
