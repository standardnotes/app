import { VaultInterface } from '@standardnotes/models'

export interface VaultStorageServiceInterface {
  updateVaults(vaults: VaultInterface[]): void
  setVaults(vaults: VaultInterface[]): void
  setVault(vault: VaultInterface): void
  getVaults(): VaultInterface[]
  getVault(vaultUuid: string): VaultInterface | undefined
}
