import { PkcKeyPair, PureCryptoInterface } from '@standardnotes/sncrypto-common'
import {
  DecryptedPayloadInterface,
  ItemsKeyInterface,
  KeySystemItemsKeyInterface,
  KeySystemRootKeyInterface,
  RootKeyInterface,
  ProtocolVersion,
} from '@standardnotes/models'
import { CreateConsistentBase64JsonPayloadUseCase } from '../Utils/CreateConsistentBase64JsonPayload'
import { doesPayloadRequireSigning } from '../../V004AlgorithmHelpers'
import { EncryptedOutputParameters } from '../../../../Types/EncryptedParameters'
import { GenerateAuthenticatedDataUseCase } from './GenerateAuthenticatedData'
import { GenerateEncryptedProtocolStringUseCase } from './GenerateEncryptedProtocolString'
import { GenerateSymmetricAdditionalDataUseCase } from './GenerateSymmetricAdditionalData'
import { isItemsKey } from '../../../../Keys/ItemsKey/ItemsKey'
import { isKeySystemItemsKey } from '../../../../Keys/KeySystemItemsKey/KeySystemItemsKey'
import { ItemAuthenticatedData } from '../../../../Types/ItemAuthenticatedData'
import { V004Algorithm } from '../../../../Algorithm'
import { AdditionalData } from '../../../../Types/EncryptionAdditionalData'
import { HashingKey } from '../Hash/HashingKey'
import { DeriveHashingKeyUseCase } from '../Hash/DeriveHashingKey'

export class GenerateEncryptedParametersUseCase {
  private generateProtocolStringUseCase = new GenerateEncryptedProtocolStringUseCase(this.crypto)
  private generateAuthenticatedDataUseCase = new GenerateAuthenticatedDataUseCase()
  private generateAdditionalDataUseCase = new GenerateSymmetricAdditionalDataUseCase(this.crypto)
  private encodeBase64DataUsecase = new CreateConsistentBase64JsonPayloadUseCase(this.crypto)
  private deriveHashingKeyUseCase = new DeriveHashingKeyUseCase(this.crypto)

  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(
    payload: DecryptedPayloadInterface,
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
    signingKeyPair?: PkcKeyPair,
  ): EncryptedOutputParameters {
    if (doesPayloadRequireSigning(payload) && !signingKeyPair) {
      throw Error('Payload requires signing but no signing key pair was provided.')
    }

    const commonAuthenticatedData = this.generateAuthenticatedDataUseCase.execute(payload, key)

    const hashingKey = this.deriveHashingKeyUseCase.execute(key)

    const { contentKey, encryptedContentKey } = this.generateEncryptedContentKey(
      key,
      hashingKey,
      commonAuthenticatedData,
      signingKeyPair,
    )

    const { encryptedContent } = this.generateEncryptedContent(
      payload,
      hashingKey,
      contentKey,
      commonAuthenticatedData,
      signingKeyPair,
    )

    return {
      uuid: payload.uuid,
      content_type: payload.content_type,
      items_key_id: isItemsKey(key) || isKeySystemItemsKey(key) ? key.uuid : undefined,
      content: encryptedContent,
      enc_item_key: encryptedContentKey,
      version: ProtocolVersion.V004,
      key_system_identifier: payload.key_system_identifier,
      shared_vault_uuid: payload.shared_vault_uuid,
    }
  }

  private generateEncryptedContent(
    payload: DecryptedPayloadInterface,
    hashingKey: HashingKey,
    contentKey: string,
    commonAuthenticatedData: ItemAuthenticatedData,
    signingKeyPair?: PkcKeyPair,
  ): {
    encryptedContent: string
  } {
    const content = JSON.stringify(payload.content)

    const { additionalData } = this.generateAdditionalDataUseCase.execute(content, hashingKey, signingKeyPair)

    const encryptedContent = this.generateProtocolStringUseCase.execute(
      content,
      contentKey,
      this.encodeBase64DataUsecase.execute<ItemAuthenticatedData>(commonAuthenticatedData),
      this.encodeBase64DataUsecase.execute<AdditionalData>(additionalData),
    )

    return {
      encryptedContent,
    }
  }

  private generateEncryptedContentKey(
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
    hashingKey: HashingKey,
    commonAuthenticatedData: ItemAuthenticatedData,
    signingKeyPair?: PkcKeyPair,
  ) {
    const contentKey = this.crypto.generateRandomKey(V004Algorithm.EncryptionKeyLength)

    const { additionalData } = this.generateAdditionalDataUseCase.execute(contentKey, hashingKey, signingKeyPair)

    const encryptedContentKey = this.generateProtocolStringUseCase.execute(
      contentKey,
      key.itemsKey,
      this.encodeBase64DataUsecase.execute<ItemAuthenticatedData>(commonAuthenticatedData),
      this.encodeBase64DataUsecase.execute<AdditionalData>(additionalData),
    )

    return {
      contentKey,
      encryptedContentKey,
    }
  }
}
