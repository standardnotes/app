import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { deconstructEncryptedPayloadString } from '../../V004AlgorithmHelpers'
import {
  ClientRawSigningData,
  DecryptedParameters,
  EncryptedParameters,
  ErrorDecryptingParameters,
  ItemContent,
  ItemsKeyInterface,
  KeySystemItemsKeyInterface,
  KeySystemRootKeyInterface,
  RootKeyInterface,
} from '@standardnotes/snjs'
import { StringToAuthenticatedDataUseCase } from '../Utils/StringToAuthenticatedData'
import { CreateConsistentBase64JsonPayloadUseCase } from '../Utils/CreateConsistentBase64JsonPayload'
import { SymmetricPayloadSigningVerificationUseCase } from './SymmetricPayloadSigningVerification'

export class GenerateDecryptedParametersUseCase {
  private base64DataUsecase = new CreateConsistentBase64JsonPayloadUseCase(this.crypto)
  private stringToAuthenticatedDataUseCase = new StringToAuthenticatedDataUseCase(this.crypto)
  private signingVerificationUseCase = new SymmetricPayloadSigningVerificationUseCase(this.crypto)

  constructor(private readonly crypto: PureCryptoInterface) {}

  execute<C extends ItemContent = ItemContent>(
    encrypted: EncryptedParameters,
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
      contentKeyResult.components,
      contentResult.components,
    )

    const clientRawSigningData = encrypted.encryptedRawSigningData
      ? this.decryptClientRawSigningData(
          encrypted.encryptedRawSigningData,
          contentKeyResult.contentKey,
          contentResult.authenticatedDataString,
        )
      : undefined

    return {
      uuid: encrypted.uuid,
      content: JSON.parse(contentResult.content),
      signature: signatureVerificationResult,
      decryptedClientRawSigningData: clientRawSigningData,
    }
  }

  decryptClientRawSigningData(
    encryptedRawSigningData: string,
    contentKey: string,
    contentAuthenticatedData: string,
  ): ClientRawSigningData | undefined {
    const signaturePayloadComponents = deconstructEncryptedPayloadString(encryptedRawSigningData)

    const decryptedClientSignatureString = this.crypto.xchacha20Decrypt(
      signaturePayloadComponents.ciphertext,
      signaturePayloadComponents.nonce,
      contentKey,
      contentAuthenticatedData,
    )

    if (decryptedClientSignatureString) {
      return JSON.parse(decryptedClientSignatureString)
    }

    return undefined
  }

  private decryptContent(encrypted: EncryptedParameters, contentKey: string) {
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
    encrypted: EncryptedParameters,
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
