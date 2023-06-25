import { PayloadInterface } from './../Interfaces/PayloadInterface'
import { VaultListingInterface } from '../../../Syncable/VaultListing/VaultListingInterface'

export function PayloadVaultOverrides(
  vault: VaultListingInterface | undefined,
): Pick<PayloadInterface, 'key_system_identifier' | 'shared_vault_uuid'> {
  if (!vault) {
    return {}
  }

  return {
    key_system_identifier: vault.systemIdentifier,
    shared_vault_uuid: vault.isSharedVaultListing() ? vault.sharing.sharedVaultUuid : undefined,
  }
}
