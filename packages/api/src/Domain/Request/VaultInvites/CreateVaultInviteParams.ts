import { VaultInviteType, VaultPermission } from '@standardnotes/responses'

export type CreateVaultInviteParams = {
  vaultUuid: string
  inviteeUuid: string
  inviterPublicKey: string
  encryptedVaultData: string
  inviteType: VaultInviteType
  permissions: VaultPermission
}
