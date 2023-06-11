import { SharedVaultPermission } from '@standardnotes/responses'

export type CreateSharedVaultInviteParams = {
  sharedVaultUuid: string
  recipientUuid: string
  encryptedMessage: string
  permissions: SharedVaultPermission
}
