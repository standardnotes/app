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
import { DeriveHashingKeyUseCase } from '../Hash/DeriveHashingKey'
import { V004Components } from '../../V004AlgorithmTypes'

export class GenerateDecryptedParametersUseCase {
  private base64DataUsecase = new CreateConsistentBase64JsonPayloadUseCase(this.crypto)
  private stringToAuthenticatedDataUseCase = new StringToAuthenticatedDataUseCase(this.crypto)
  private signingVerificationUseCase = new GenerateSymmetricPayloadSignatureResultUseCase(this.crypto)
  private deriveHashingKeyUseCase = new DeriveHashingKeyUseCase(this.crypto)

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

    const contentResult = this.decryptContent(encrypted, contentKeyResult.decrypted)
    if (!contentResult) {
      return {
        uuid: encrypted.uuid,
        errorDecrypting: true,
      }
    }

    const hashingKey = this.deriveHashingKeyUseCase.execute(key)

    const signatureVerificationResult = this.signingVerificationUseCase.execute(
      encrypted,
      hashingKey,
      {
        additionalData: contentKeyResult.components.additionalData,
        plaintext: contentKeyResult.decrypted,
      },
      {
        additionalData: contentResult.components.additionalData,
        plaintext: contentResult.decrypted,
      },
    )

    return {
      uuid: encrypted.uuid,
      content: JSON.parse(contentResult.decrypted),
      signatureData: signatureVerificationResult,
    }
  }

  private decryptContent(encrypted: EncryptedOutputParameters, contentKey: string) {
    const contentComponents = deconstructEncryptedPayloadString(encrypted.content)

    return this.decrypt(encrypted, contentComponents, contentKey)
  }

  private decryptContentKey(
    encrypted: EncryptedOutputParameters,
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
  ) {
    const contentKeyComponents = deconstructEncryptedPayloadString(encrypted.enc_item_key)

    return this.decrypt(encrypted, contentKeyComponents, key.itemsKey)
  }

  private decrypt(encrypted: EncryptedOutputParameters, components: V004Components, key: string) {
    const rawAuthenticatedData = this.stringToAuthenticatedDataUseCase.executeRaw(components.authenticatedData)

    const doesRawContainLegacyUppercaseUuid = /[A-Z]/.test(rawAuthenticatedData.u)

    const authenticatedData = this.stringToAuthenticatedDataUseCase.execute(components.authenticatedData, {
      u: doesRawContainLegacyUppercaseUuid ? encrypted.uuid.toUpperCase() : encrypted.uuid,
      v: encrypted.version,
      ksi: encrypted.key_system_identifier,
      svu: encrypted.shared_vault_uuid,
    })

    const authenticatedDataString = this.base64DataUsecase.execute(authenticatedData)

    const decrypted = this.crypto.xchacha20Decrypt(
      components.ciphertext,
      components.nonce,
      key,
      authenticatedDataString,
    )

    if (!decrypted) {
      return null
    }

    return {
      decrypted,
      components: components,
      authenticatedDataString,
    }
  }
}
