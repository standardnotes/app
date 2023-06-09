import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { EncryptedParameters } from '../../../../Types/EncryptedParameters'
import { RootKeyEncryptedAuthenticatedData } from '../../../../Types/RootKeyEncryptedAuthenticatedData'
import { ItemAuthenticatedData } from '../../../../Types/ItemAuthenticatedData'
import { LegacyAttachedData } from '../../../../Types/LegacyAttachedData'
import { deconstructEncryptedPayloadString } from "../../V004AlgorithmHelpers"
import { StringToAuthenticatedDataUseCase } from '../Utils/StringToAuthenticatedData'

export class GetPayloadAuthenticatedDataUseCase {
  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(
    encrypted: EncryptedParameters,
  ): RootKeyEncryptedAuthenticatedData | ItemAuthenticatedData | LegacyAttachedData | undefined {
    const itemKeyComponents = deconstructEncryptedPayloadString(encrypted.enc_item_key)
    const authenticatedDataString = itemKeyComponents.authenticatedData
    const stringToAuthenticatedDataUseCase = new StringToAuthenticatedDataUseCase(this.crypto)
    const result = stringToAuthenticatedDataUseCase.execute(authenticatedDataString, {
      u: encrypted.uuid,
      v: encrypted.version,
      ksi: encrypted.key_system_identifier,
      svu: encrypted.shared_vault_uuid,
    })

    return result
  }
}
