import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { ItemAuthenticatedData, RootKeyEncryptedAuthenticatedData, sortedCopy } from '@standardnotes/snjs'

export class StringToAuthenticatedDataUseCase {
  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(
    rawAuthenticatedData: string,
    override: ItemAuthenticatedData,
  ): RootKeyEncryptedAuthenticatedData | ItemAuthenticatedData {
    const base = JSON.parse(this.crypto.base64Decode(rawAuthenticatedData))
    return sortedCopy({
      ...base,
      ...override,
    })
  }
}
