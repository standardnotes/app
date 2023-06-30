import { SharedVaultUserServerHash, SharedVaultServerHash } from '@standardnotes/responses'

export type CreateSharedVaultResponse = {
  sharedVault: SharedVaultServerHash
  sharedVaultUser: SharedVaultUserServerHash
}
