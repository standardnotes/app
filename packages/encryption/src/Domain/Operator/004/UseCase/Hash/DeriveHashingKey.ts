import {
  ItemsKeyInterface,
  KeySystemItemsKeyInterface,
  KeySystemRootKeyInterface,
  RootKeyInterface,
} from '@standardnotes/models'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { V004Algorithm } from '../../../../Algorithm'
import { HashingKey } from './HashingKey'

export class DeriveHashingKeyUseCase {
  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
  ): HashingKey {
    const hashingKey = this.crypto.sodiumCryptoKdfDeriveFromKey(
      key.itemsKey,
      V004Algorithm.PayloadKeyHashingKeySubKeyNumber,
      V004Algorithm.PayloadKeyHashingKeySubKeyBytes,
      V004Algorithm.PayloadKeyHashingKeySubKeyContext,
    )

    return {
      key: hashingKey,
    }
  }
}
