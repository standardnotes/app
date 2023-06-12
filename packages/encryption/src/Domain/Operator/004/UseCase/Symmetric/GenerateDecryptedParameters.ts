import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { deconstructEncryptedPayloadString } from '../../V004AlgorithmHelpers'
import {
  ItemContent,
  ItemsKeyInterface,
  KeySystemItemsKeyInterface,
  KeySystemRootKeyInterface,
  RootKeyInterface,
} from '@standardnotes/models'
import { StringToAuthenticatedDataUseCase } from '../Utils/StringToAuthenticatedData'
import { CreateConsistentBase64JsonPayloadUseCase } from '../Utils/CreateConsistentBase64JsonPayload'
import { GenerateSymmetricPayloadSignatureResultUseCase } from './GenerateSymmetricPayloadSignatureResult'
import {
  EncryptedInputParameters,
  EncryptedOutputParameters,
  ErrorDecryptingParameters,
} from './../../../../Types/EncryptedParameters'
import { DecryptedParameters } from '../../../../Types/DecryptedParameters'

export class GenerateDecryptedParametersUseCase {
  private base64DataUsecase = new CreateConsistentBase64JsonPayloadUseCase(this.crypto)
  private stringToAuthenticatedDataUseCase = new StringToAuthenticatedDataUseCase(this.crypto)
  private signingVerificationUseCase = new GenerateSymmetricPayloadSignatureResultUseCase(this.crypto)

  constructor(private readonly crypto: PureCryptoInterface) {}

  execute<C extends ItemContent = ItemContent>(
    encrypted: EncryptedInputParameters,
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
  ): DecryptedParameters<C> | ErrorDecryptingParameters {
    const contentKeyResult = this.decryptContentKey(encrypted, key)
    if (!contentKeyResult) {
      console.error('Error decrypting contentKey from parameters', encrypted)
      return {
        uuid: encrypted.uuid,
        errorDecrypting: true,
      }
    }

    const contentResult = this.decryptContent(encrypted, contentKeyResult.contentKey)
    if (!contentResult) {
      return {
        uuid: encrypted.uuid,
        errorDecrypting: true,
      }
    }

    const signatureVerificationResult = this.signingVerificationUseCase.execute(
      encrypted,
      key.itemsKey,
      {
        additionalData: contentKeyResult.components.additionalData,
        plaintext: contentKeyResult.contentKey,
      },
      {
        additionalData: contentResult.components.additionalData,
        plaintext: contentResult.content,
      },
    )

    return {
      uuid: encrypted.uuid,
      content: JSON.parse(contentResult.content),
      signature_result: signatureVerificationResult,
    }
  }

  private decryptContent(encrypted: EncryptedOutputParameters, contentKey: string) {
    const contentComponents = deconstructEncryptedPayloadString(encrypted.content)

    const contentAuthenticatedData = this.stringToAuthenticatedDataUseCase.execute(
      contentComponents.authenticatedData,
      {
        u: encrypted.uuid,
        v: encrypted.version,
        ksi: encrypted.key_system_identifier,
        svu: encrypted.shared_vault_uuid,
      },
    )

    const authenticatedDataString = this.base64DataUsecase.execute(contentAuthenticatedData)

    const content = this.crypto.xchacha20Decrypt(
      contentComponents.ciphertext,
      contentComponents.nonce,
      contentKey,
      authenticatedDataString,
    )

    if (!content) {
      return null
    }

    return {
      content,
      components: contentComponents,
      authenticatedDataString,
    }
  }

  private decryptContentKey(
    encrypted: EncryptedOutputParameters,
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
  ) {
    const contentKeyComponents = deconstructEncryptedPayloadString(encrypted.enc_item_key)

    const contentKeyAuthenticatedData = this.stringToAuthenticatedDataUseCase.execute(
      contentKeyComponents.authenticatedData,
      {
        u: encrypted.uuid,
        v: encrypted.version,
        ksi: encrypted.key_system_identifier,
        svu: encrypted.shared_vault_uuid,
      },
    )

    const authenticatedDataString = this.base64DataUsecase.execute(contentKeyAuthenticatedData)

    const contentKey = this.crypto.xchacha20Decrypt(
      contentKeyComponents.ciphertext,
      contentKeyComponents.nonce,
      key.itemsKey,
      authenticatedDataString,
    )

    if (!contentKey) {
      return null
    }

    return {
      contentKey,
      components: contentKeyComponents,
      authenticatedDataString,
    }
  }
}
