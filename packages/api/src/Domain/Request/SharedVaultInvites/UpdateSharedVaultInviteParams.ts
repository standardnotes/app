import { SharedVaultPermission } from '@standardnotes/responses'

export type UpdateSharedVaultInviteParams = {
  sharedVaultUuid: string
  inviteUuid: string
  encryptedMessage: string
  permissions?: SharedVaultPermission
}
