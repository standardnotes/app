import { VaultServerHash } from '@standardnotes/responses'

export interface VaultStorageServiceInterface {
  updateVaults(vaults: VaultServerHash[]): void
  setVaults(vaults: VaultServerHash[]): void
  setVault(vault: VaultServerHash): void
  getVaults(): VaultServerHash[]
  getVault(vaultUuid: string): VaultServerHash | undefined
}
