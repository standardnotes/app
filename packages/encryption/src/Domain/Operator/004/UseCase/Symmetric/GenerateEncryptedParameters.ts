import { PkcKeyPair, PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { doesPayloadRequireSigning } from "../../V004AlgorithmHelpers"
import {
  DecryptedPayloadInterface,
  EncryptedParameters,
  ItemsKeyInterface,
  KeySystemItemsKeyInterface,
  KeySystemRootKeyInterface,
  ProtocolVersion,
  RootKeyInterface,
  V004Algorithm,
  isItemsKey,
  isKeySystemItemsKey,
} from '@standardnotes/snjs'
import { CreateConsistentBase64JsonPayloadUseCase } from '../Utils/CreateConsistentBase64JsonPayload'
import { GenerateEncryptedProtocolStringUseCase } from './GenerateEncryptedProtocolString'
import { GenerateAuthenticatedDataForPayloadUseCase } from './GenerateAuthenticatedDataForPayload'
import { GenerateSymmetricPlaintextSigningDataUseCase } from './GenerateSymmetricPlaintextSigningData'
import { GenerateEncryptedClientContentSignaturePayload } from './GenerateEncryptedClientContentSignaturePayload'

export class GenerateEncryptedParametersUseCase {
  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(
    payload: DecryptedPayloadInterface,
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
    signingKeyPair?: PkcKeyPair,
  ): EncryptedParameters {
    if (doesPayloadRequireSigning(payload) && !signingKeyPair) {
      throw Error('Payload requires signing but no signing key pair was provided.')
    }

    const generateProtocolStringUseCase = new GenerateEncryptedProtocolStringUseCase(this.crypto)

    const generateAuthenticatedDataUseCase = new GenerateAuthenticatedDataForPayloadUseCase()
    const commonAuthenticatedData = generateAuthenticatedDataUseCase.execute(payload, key)

    const contentKey = this.crypto.generateRandomKey(V004Algorithm.EncryptionKeyLength)

    const generateSigningDataUseCase = new GenerateSymmetricPlaintextSigningDataUseCase(this.crypto)

    const contentKeyDoesNotNeedToMaintainPersistentSignatures = undefined
    const contentKeySigningDataResult = generateSigningDataUseCase.execute(
      contentKey,
      contentKeyDoesNotNeedToMaintainPersistentSignatures,
      signingKeyPair,
    )

    const base64DataUsecase = new CreateConsistentBase64JsonPayloadUseCase(this.crypto)

    const encryptedContentKey = generateProtocolStringUseCase.execute(
      contentKey,
      key.itemsKey,
      base64DataUsecase.execute(commonAuthenticatedData),
      base64DataUsecase.execute(contentKeySigningDataResult.signingData),
    )

    const contentPlaintext = JSON.stringify(payload.content)
    const contentSigningDataResult = generateSigningDataUseCase.execute(
      contentPlaintext,
      payload.decryptedClientSignaturePayload,
      signingKeyPair,
    )

    const encryptedContentString = generateProtocolStringUseCase.execute(
      contentPlaintext,
      contentKey,
      base64DataUsecase.execute(commonAuthenticatedData),
      base64DataUsecase.execute(contentSigningDataResult.signingData),
    )

    const generateClientSignatureUseCase = new GenerateEncryptedClientContentSignaturePayload(this.crypto)

    const encryptedClientSignaturePayload = contentSigningDataResult.signingData.embeddedValue
      ? generateClientSignatureUseCase.execute(
          contentSigningDataResult.signingData.embeddedValue,
          contentSigningDataResult.plaintextHash,
          contentKey,
          commonAuthenticatedData,
        )
      : undefined

    return {
      uuid: payload.uuid,
      content_type: payload.content_type,
      items_key_id: isItemsKey(key) || isKeySystemItemsKey(key) ? key.uuid : undefined,
      content: encryptedContentString,
      enc_item_key: encryptedContentKey,
      version: ProtocolVersion.V004,
      encryptedClientSignaturePayload,
    }
  }
}
