import { SharedVaultPermission } from '@standardnotes/responses'

export type UpdateSharedVaultInviteParams = {
  sharedVaultUuid: string
  inviteUuid: string
  senderPublicKey: string
  encryptedMessage: string
  permissions?: SharedVaultPermission
}
