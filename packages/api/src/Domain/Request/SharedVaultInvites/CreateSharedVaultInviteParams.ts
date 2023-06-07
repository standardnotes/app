import { SharedVaultInviteType, SharedVaultPermission } from '@standardnotes/responses'

export type CreateSharedVaultInviteParams = {
  sharedVaultUuid: string
  inviteeUuid: string
  inviterPublicKey: string
  encryptedMessage: string
  inviteType: SharedVaultInviteType
  permissions: SharedVaultPermission
}
