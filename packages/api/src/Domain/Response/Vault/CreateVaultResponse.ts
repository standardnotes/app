import { VaultUserServerHash, VaultServerHash } from '@standardnotes/responses'

export type CreateVaultResponse = {
  vault: VaultServerHash
  vaultUser: VaultUserServerHash
}
