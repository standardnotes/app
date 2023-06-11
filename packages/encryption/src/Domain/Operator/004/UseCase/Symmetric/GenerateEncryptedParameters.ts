import { ProtocolVersion } from '@standardnotes/common'
import { PkcKeyPair, PureCryptoInterface } from '@standardnotes/sncrypto-common'
import {
  ClientRawSigningData,
  DecryptedPayloadInterface,
  ItemsKeyInterface,
  KeySystemItemsKeyInterface,
  KeySystemRootKeyInterface,
  RootKeyInterface,
} from '@standardnotes/models'
import { CreateConsistentBase64JsonPayloadUseCase } from '../Utils/CreateConsistentBase64JsonPayload'
import { doesPayloadRequireSigning } from '../../V004AlgorithmHelpers'
import { EncryptedParameters } from '../../../../Types/EncryptedParameters'
import { GenerateAuthenticatedDataForPayloadUseCase } from './GenerateAuthenticatedDataForPayload'
import { GenerateEncryptedProtocolStringUseCase } from './GenerateEncryptedProtocolString'
import { GenerateRawClientSigningDataUseCase } from './GenerateRawClientSigningData'
import { GenerateSymmetricAdditionalDataUseCase } from './GenerateSymmetricAdditionalData'
import { isItemsKey } from '../../../../Keys/ItemsKey/ItemsKey'
import { isKeySystemItemsKey } from '../../../../Keys/KeySystemItemsKey/KeySystemItemsKey'
import { ItemAuthenticatedData } from '../../../../Types/ItemAuthenticatedData'
import { V004Algorithm } from '../../../../Algorithm'
import { AdditionalData } from '../../../../Types/EncryptionAdditionalData'

export class GenerateEncryptedParametersUseCase {
  private generateProtocolStringUseCase = new GenerateEncryptedProtocolStringUseCase(this.crypto)
  private generateAuthenticatedDataUseCase = new GenerateAuthenticatedDataForPayloadUseCase()
  private generateAdditionalDataUseCase = new GenerateSymmetricAdditionalDataUseCase(this.crypto)
  private encodeBase64DataUsecase = new CreateConsistentBase64JsonPayloadUseCase(this.crypto)
  private generatePersistentClientSignatureUseCase = new GenerateRawClientSigningDataUseCase()

  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(
    payload: DecryptedPayloadInterface,
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
    signingKeyPair?: PkcKeyPair,
  ): EncryptedParameters {
    if (doesPayloadRequireSigning(payload) && !signingKeyPair) {
      throw Error('Payload requires signing but no signing key pair was provided.')
    }

    const commonAuthenticatedData = this.generateAuthenticatedDataUseCase.execute(payload, key)

    const { contentKey, encryptedContentKey } = this.generateEncryptedContentKey(
      key,
      commonAuthenticatedData,
      signingKeyPair,
    )

    const { encryptedContent, persistentClientSignature } = this.generateEncryptedContentAndPersistentClientSignature(
      payload,
      key,
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
      rawSigningDataClientOnly: persistentClientSignature,
    }
  }

  private generateEncryptedContentAndPersistentClientSignature(
    payload: DecryptedPayloadInterface,
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
    contentKey: string,
    commonAuthenticatedData: ItemAuthenticatedData,
    signingKeyPair?: PkcKeyPair,
  ): {
    encryptedContent: string
    persistentClientSignature: ClientRawSigningData | undefined
  } {
    const content = JSON.stringify(payload.content)

    const { additionalData, plaintextHash } = this.generateAdditionalDataUseCase.execute(
      content,
      key.itemsKey,
      signingKeyPair,
    )

    const encryptedContent = this.generateProtocolStringUseCase.execute(
      content,
      contentKey,
      this.encodeBase64DataUsecase.execute<ItemAuthenticatedData>(commonAuthenticatedData),
      this.encodeBase64DataUsecase.execute<AdditionalData>(additionalData),
    )

    const persistentClientSignature = additionalData.signingData
      ? this.generatePersistentClientSignatureUseCase.execute(
          additionalData.signingData,
          payload.rawSigningDataClientOnly,
          plaintextHash,
        )
      : undefined

    return {
      encryptedContent,
      persistentClientSignature,
    }
  }

  private generateEncryptedContentKey(
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
    commonAuthenticatedData: ItemAuthenticatedData,
    signingKeyPair?: PkcKeyPair,
  ) {
    const contentKey = this.crypto.generateRandomKey(V004Algorithm.EncryptionKeyLength)

    const { additionalData } = this.generateAdditionalDataUseCase.execute(contentKey, key.itemsKey, signingKeyPair)

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
