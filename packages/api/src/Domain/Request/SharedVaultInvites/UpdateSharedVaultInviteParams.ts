import { SharedVaultPermission } from '@standardnotes/responses'

export type UpdateSharedVaultInviteParams = {
  sharedVaultUuid: string
  inviteUuid: string
  inviterPublicKey: string
  encryptedMessage: string
  permissions?: SharedVaultPermission
}
