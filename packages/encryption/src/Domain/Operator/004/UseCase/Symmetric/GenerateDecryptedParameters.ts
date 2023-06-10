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
  constructor(private readonly crypto: PureCryptoInterface) {}

  execute<C extends ItemContent = ItemContent>(
    encrypted: EncryptedParameters,
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
  ): DecryptedParameters<C> | ErrorDecryptingParameters {
    const contentKeyComponents = deconstructEncryptedPayloadString(encrypted.enc_item_key)

    const stringToAuthenticatedDataUseCase = new StringToAuthenticatedDataUseCase(this.crypto)
    const contentKeyAuthenticatedData = stringToAuthenticatedDataUseCase.execute(
      contentKeyComponents.authenticatedData,
      {
        u: encrypted.uuid,
        v: encrypted.version,
        ksi: encrypted.key_system_identifier,
        svu: encrypted.shared_vault_uuid,
      },
    )

    const base64DataUsecase = new CreateConsistentBase64JsonPayloadUseCase(this.crypto)

    const commonAuthenticatedDataString = base64DataUsecase.execute(contentKeyAuthenticatedData)

    const contentKey = this.crypto.xchacha20Decrypt(
      contentKeyComponents.ciphertext,
      contentKeyComponents.nonce,
      key.itemsKey,
      commonAuthenticatedDataString,
    )

    if (!contentKey) {
      console.error('Error decrypting contentKey from parameters', encrypted)
      return {
        uuid: encrypted.uuid,
        errorDecrypting: true,
      }
    }

    const contentComponents = deconstructEncryptedPayloadString(encrypted.content)

    const content = this.crypto.xchacha20Decrypt(
      contentComponents.ciphertext,
      contentComponents.nonce,
      contentKey,
      commonAuthenticatedDataString,
    )

    if (!content) {
      return {
        uuid: encrypted.uuid,
        errorDecrypting: true,
      }
    }

    let decryptedClientRawSigningData: ClientRawSigningData | undefined
    if (encrypted.encryptedRawSigningData) {
      const signaturePayloadComponents = deconstructEncryptedPayloadString(encrypted.encryptedRawSigningData)

      const decryptedClientSignatureString = this.crypto.xchacha20Decrypt(
        signaturePayloadComponents.ciphertext,
        signaturePayloadComponents.nonce,
        contentKey,
        commonAuthenticatedDataString,
      )

      if (decryptedClientSignatureString) {
        decryptedClientRawSigningData = JSON.parse(decryptedClientSignatureString)
      }
    }

    const signingVerificationUseCase = new SymmetricPayloadSigningVerificationUseCase(this.crypto)

    const signatureVerificationResult = signingVerificationUseCase.execute(
      encrypted,
      contentKeyComponents,
      contentComponents,
    )

    return {
      uuid: encrypted.uuid,
      content: JSON.parse(content),
      signature: signatureVerificationResult,
      decryptedClientRawSigningData,
    }
  }
}
