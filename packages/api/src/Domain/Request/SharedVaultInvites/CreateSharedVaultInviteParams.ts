import { SharedVaultUserPermission } from '@standardnotes/domain-core'

export type CreateSharedVaultInviteParams = {
  sharedVaultUuid: string
  recipientUuid: string
  encryptedMessage: string
  permission: SharedVaultUserPermission
}
