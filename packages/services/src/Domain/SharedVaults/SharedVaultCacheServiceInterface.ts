import { SharedVaultServerHash } from '@standardnotes/responses'

export interface SharedVaultCacheServiceInterface {
  setSharedVaults(sharedVaults: SharedVaultServerHash[]): void
  updateSharedVaults(sharedVaults: SharedVaultServerHash[]): void
  getSharedVaults(): SharedVaultServerHash[]
  setSharedVault(sharedVault: SharedVaultServerHash): void
  getSharedVault(sharedVaultUuid: string): SharedVaultServerHash | undefined
  getSharedVaultForKeySystemIdentifier(systemIdentifier: string): SharedVaultServerHash | undefined
  getKeySystemIdentifierForSharedVault(sharedVaultUuid: string): string | undefined
}
