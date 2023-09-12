import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { sortedCopy } from '@standardnotes/utils'
import { RootKeyEncryptedAuthenticatedData } from './../../../../Types/RootKeyEncryptedAuthenticatedData'
import { ItemAuthenticatedData } from './../../../../Types/ItemAuthenticatedData'

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

  executeRaw(rawAuthenticatedData: string): RootKeyEncryptedAuthenticatedData | ItemAuthenticatedData {
    const base = JSON.parse(this.crypto.base64Decode(rawAuthenticatedData))
    return base
  }
}
