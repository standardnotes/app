import { VaultDisplayListing, isDecryptedItem } from '@standardnotes/models'
import { KeySystemItemsKeyAuthenticatedData } from '@standardnotes/encryption/src/Domain/Types/KeySystemItemsKeyAuthenticatedData'
import { EncryptionProviderInterface } from '@standardnotes/encryption'

export class GetVaultsUseCase {
  constructor(private encryption: EncryptionProviderInterface) {}

  execute(): VaultDisplayListing[] {
    const listings: VaultDisplayListing[] = []
    const handledIdentifiers = new Set()
    const keySystemItemsKeys = this.encryption.keySystemKeyManager.getAllKeySystemItemsKeys()

    for (const keySystemItemsKey of keySystemItemsKeys) {
      const systemIdentifier = keySystemItemsKey.key_system_identifier
      if (!systemIdentifier) {
        throw new Error('Key system items key does not have vault system identifier')
      }

      if (handledIdentifiers.has(systemIdentifier)) {
        continue
      }

      handledIdentifiers.add(systemIdentifier)

      if (isDecryptedItem(keySystemItemsKey)) {
        const primaryRootKey = this.encryption.keySystemKeyManager.getPrimaryKeySystemRootKey(systemIdentifier)
        if (!primaryRootKey) {
          throw new Error('Key system does not have primary items key')
        }

        listings.push({
          systemIdentifier,
          passwordType: primaryRootKey.keyParams.passwordType,
          keyParams: primaryRootKey.keyParams,
          sharedVaultUuid: keySystemItemsKey.shared_vault_uuid,
          ownerUserUuid: keySystemItemsKey.user_uuid,
          decrypted: {
            name: primaryRootKey.systemName,
            description: primaryRootKey.systemDescription,
          },
        })
      } else {
        const authenticatedData =
          this.encryption.getEmbeddedPayloadAuthenticatedData<KeySystemItemsKeyAuthenticatedData>(
            keySystemItemsKey.payload,
          )
        if (!authenticatedData) {
          throw new Error('Key system items key does not have authenticated data')
        }

        listings.push({
          systemIdentifier,
          passwordType: authenticatedData.kp.passwordType,
          keyParams: authenticatedData.kp,
          sharedVaultUuid: keySystemItemsKey.shared_vault_uuid,
          ownerUserUuid: keySystemItemsKey.user_uuid,
          encrypted: {
            label: systemIdentifier,
          },
        })
      }
    }

    return listings
  }
}
