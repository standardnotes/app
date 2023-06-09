import {
  CreateDecryptedItemFromPayload,
  DecryptedPayload,
  DecryptedTransferPayload,
  FillItemContentSpecialized,
  KeySystemIdentifier,
  KeySystemItemsKeyContentSpecialized,
  KeySystemItemsKeyInterface,
  PayloadTimestampDefaults,
} from '@standardnotes/models'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { V004Algorithm } from '../../../../Algorithm'
import { ContentType, ProtocolVersion } from '@standardnotes/common'

export class CreateKeySystemItemsKeyUseCase {
  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(uuid: string, keySystemIdentifier: KeySystemIdentifier): KeySystemItemsKeyInterface {
    const key = this.crypto.generateRandomKey(V004Algorithm.EncryptionKeyLength)
    const content = FillItemContentSpecialized<KeySystemItemsKeyContentSpecialized>({
      itemsKey: key,
      keyTimestamp: new Date().getTime(),
      version: ProtocolVersion.V004,
    })

    const transferPayload: DecryptedTransferPayload = {
      uuid: uuid,
      content_type: ContentType.KeySystemItemsKey,
      key_system_identifier: keySystemIdentifier,
      shared_vault_uuid: undefined,
      content: content,
      dirty: true,
      ...PayloadTimestampDefaults(),
    }

    const payload = new DecryptedPayload(transferPayload)
    return CreateDecryptedItemFromPayload(payload)
  }
}
