import { VaultInterface } from '@standardnotes/models'
import { StorageServiceInterface } from '../Storage/StorageServiceInterface'
import { StorageKey } from '../Storage/StorageKeys'
import { VaultStorageServiceInterface } from './VaultStorageServiceInterface'

export class VaultStorageService implements VaultStorageServiceInterface {
  constructor(private storage: StorageServiceInterface) {}

  setVaults(vaults: VaultInterface[]): void {
    this.storage.setValue(StorageKey.Vaults, vaults)
  }

  updateVaults(vaults: VaultInterface[]): void {
    for (const vault of vaults) {
      this.setVault(vault)
    }
  }

  getVaults(): VaultInterface[] {
    const result = this.storage.getValue<VaultInterface[]>(StorageKey.Vaults)
    return result ? result : []
  }

  setVault(vault: VaultInterface): void {
    const vaults = this.getVaults()
    const index = vaults.findIndex((g) => g.uuid === vault.uuid)
    if (index !== -1) {
      vaults[index] = vault
    } else {
      vaults.push(vault)
    }
    this.setVaults(vaults)
  }

  getVault(vaultUuid: string): VaultInterface | undefined {
    const vaults = this.getVaults()
    return vaults.find((vault) => vault.uuid === vaultUuid)
  }
}
