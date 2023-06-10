import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { EncryptedParameters } from '../../../../Types/EncryptedParameters'
import { RootKeyEncryptedAuthenticatedData } from '../../../../Types/RootKeyEncryptedAuthenticatedData'
import { ItemAuthenticatedData } from '../../../../Types/ItemAuthenticatedData'
import { LegacyAttachedData } from '../../../../Types/LegacyAttachedData'
import { deconstructEncryptedPayloadString } from '../../V004AlgorithmHelpers'
import { StringToAuthenticatedDataUseCase } from '../Utils/StringToAuthenticatedData'

export class GetPayloadAuthenticatedDataUseCase {
  private stringToAuthenticatedDataUseCase = new StringToAuthenticatedDataUseCase(this.crypto)

  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(
    encrypted: EncryptedParameters,
  ): RootKeyEncryptedAuthenticatedData | ItemAuthenticatedData | LegacyAttachedData | undefined {
    const itemKeyComponents = deconstructEncryptedPayloadString(encrypted.enc_item_key)

    const authenticatedDataString = itemKeyComponents.authenticatedData

    const result = this.stringToAuthenticatedDataUseCase.execute(authenticatedDataString, {
      u: encrypted.uuid,
      v: encrypted.version,
      ksi: encrypted.key_system_identifier,
      svu: encrypted.shared_vault_uuid,
    })

    return result
  }
}
