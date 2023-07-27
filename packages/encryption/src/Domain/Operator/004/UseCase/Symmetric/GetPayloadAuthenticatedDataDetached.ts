import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { EncryptedOutputParameters } from '../../../../Types/EncryptedParameters'
import { RootKeyEncryptedAuthenticatedData } from '../../../../Types/RootKeyEncryptedAuthenticatedData'
import { ItemAuthenticatedData } from '../../../../Types/ItemAuthenticatedData'
import { LegacyAttachedData } from '../../../../Types/LegacyAttachedData'
import { deconstructEncryptedPayloadString } from '../../V004AlgorithmHelpers'
import { ParseConsistentBase64JsonPayloadUseCase } from '../Utils/ParseConsistentBase64JsonPayload'

export class GetPayloadAuthenticatedDataDetachedUseCase {
  private parseStringUseCase = new ParseConsistentBase64JsonPayloadUseCase(this.crypto)

  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(
    encrypted: EncryptedOutputParameters,
  ): RootKeyEncryptedAuthenticatedData | ItemAuthenticatedData | LegacyAttachedData | undefined {
    const contentKeyComponents = deconstructEncryptedPayloadString(encrypted.enc_item_key)

    const authenticatedDataString = contentKeyComponents.authenticatedData

    const result = this.parseStringUseCase.execute<
      RootKeyEncryptedAuthenticatedData | ItemAuthenticatedData | LegacyAttachedData
    >(authenticatedDataString)

    return result
  }
}
