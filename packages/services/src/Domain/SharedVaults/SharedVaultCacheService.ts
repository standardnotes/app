import { StorageServiceInterface } from '../Storage/StorageServiceInterface'
import { StorageKey } from '../Storage/StorageKeys'
import { SharedVaultServerHash } from '@standardnotes/responses'
import { SharedVaultCacheServiceInterface } from './SharedVaultCacheServiceInterface'

export class SharedVaultCacheService implements SharedVaultCacheServiceInterface {
  constructor(private storage: StorageServiceInterface) {}

  setSharedVaults(sharedVaults: SharedVaultServerHash[]): void {
    this.storage.setValue(StorageKey.SharedVaultCache, sharedVaults)
  }

  updateSharedVaults(sharedVaults: SharedVaultServerHash[]): void {
    for (const sharedVault of sharedVaults) {
      this.setSharedVault(sharedVault)
    }
  }

  getSharedVaults(): SharedVaultServerHash[] {
    const result = this.storage.getValue<SharedVaultServerHash[]>(StorageKey.SharedVaultCache)
    return result ? result : []
  }

  setSharedVault(sharedVault: SharedVaultServerHash): void {
    const sharedVaults = this.getSharedVaults()
    const index = sharedVaults.findIndex((g) => g.uuid === sharedVault.uuid)
    if (index !== -1) {
      sharedVaults[index] = sharedVault
    } else {
      sharedVaults.push(sharedVault)
    }
    this.setSharedVaults(sharedVaults)
  }

  getSharedVault(sharedVaultUuid: string): SharedVaultServerHash | undefined {
    const sharedVaults = this.getSharedVaults()
    return sharedVaults.find((sharedVault) => sharedVault.uuid === sharedVaultUuid)
  }

  getSharedVaultForKeySystemIdentifier(systemIdentifier: string): SharedVaultServerHash | undefined {
    const sharedVaults = this.getSharedVaults()
    return sharedVaults.find((sharedVault) => sharedVault.key_system_identifier === systemIdentifier)
  }

  getKeySystemIdentifierForSharedVault(sharedVaultUuid: string): string | undefined {
    const sharedVault = this.getSharedVault(sharedVaultUuid)
    return sharedVault ? sharedVault.key_system_identifier : undefined
  }
}
