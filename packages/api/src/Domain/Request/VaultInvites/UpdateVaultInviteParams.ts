import { VaultPermission } from '@standardnotes/responses'

export type UpdateVaultInviteParams = {
  vaultUuid: string
  inviteUuid: string
  inviterPublicKey: string
  encryptedVaultData: string
  permissions?: VaultPermission
}
