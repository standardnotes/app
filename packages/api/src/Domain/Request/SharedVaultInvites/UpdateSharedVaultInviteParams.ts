import { SharedVaultUserPermission } from '@standardnotes/domain-core'

export type UpdateSharedVaultInviteParams = {
  sharedVaultUuid: string
  inviteUuid: string
  encryptedMessage: string
  permission?: SharedVaultUserPermission
}
