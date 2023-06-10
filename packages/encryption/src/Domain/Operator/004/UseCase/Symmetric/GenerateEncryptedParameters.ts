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
import { GeneratePersistentClientSignature } from './GeneratePersistentClientSignature'
import { GenerateSymmetricSigningDataUseCase } from './GenerateSymmetricPlaintextSigningData'
import { isItemsKey } from '../../../../Keys/ItemsKey/ItemsKey'
import { isKeySystemItemsKey } from '../../../../Keys/KeySystemItemsKey/KeySystemItemsKey'
import { ItemAuthenticatedData } from '../../../../Types/ItemAuthenticatedData'
import { V004Algorithm } from '../../../../Algorithm'

export class GenerateEncryptedParametersUseCase {
  private generateProtocolStringUseCase = new GenerateEncryptedProtocolStringUseCase(this.crypto)
  private generateAuthenticatedDataUseCase = new GenerateAuthenticatedDataForPayloadUseCase()
  private generateSigningDataUseCase = new GenerateSymmetricSigningDataUseCase(this.crypto)
  private base64DataUsecase = new CreateConsistentBase64JsonPayloadUseCase(this.crypto)
  private generatePersistentClientSignatureUseCase = new GeneratePersistentClientSignature()

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

    const { signingPayload, plaintextHash } = this.generateSigningDataUseCase.execute(
      content,
      key.itemsKey,
      signingKeyPair,
    )

    const encryptedContent = this.generateProtocolStringUseCase.execute(
      content,
      contentKey,
      this.base64DataUsecase.execute(commonAuthenticatedData),
      this.base64DataUsecase.execute(signingPayload),
    )

    const persistentClientSignature = !signingPayload.data
      ? undefined
      : this.generatePersistentClientSignatureUseCase.execute(
          signingPayload.data,
          payload.rawSigningDataClientOnly,
          plaintextHash,
        )

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

    const { signingPayload } = this.generateSigningDataUseCase.execute(contentKey, key.itemsKey, signingKeyPair)

    const encryptedContentKey = this.generateProtocolStringUseCase.execute(
      contentKey,
      key.itemsKey,
      this.base64DataUsecase.execute(commonAuthenticatedData),
      this.base64DataUsecase.execute(signingPayload),
    )

    return {
      contentKey,
      encryptedContentKey,
    }
  }
}
