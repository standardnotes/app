import { SharedVaultInviteType, SharedVaultPermission } from '@standardnotes/responses'

export type CreateSharedVaultInviteParams = {
  sharedVaultUuid: string
  inviteeUuid: string
  inviterPublicKey: string
  encryptedVaultKeyContent: string
  inviteType: SharedVaultInviteType
  permissions: SharedVaultPermission
}
