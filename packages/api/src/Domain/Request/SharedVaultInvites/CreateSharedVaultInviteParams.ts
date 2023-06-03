import { SharedVaultInviteType, SharedVaultPermission } from '@standardnotes/responses'

export type CreateSharedVaultInviteParams = {
  sharedVaultUuid: string
  inviteeUuid: string
  inviterPublicKey: string
  encryptedKeySystemRootKeyContent: string
  inviteType: SharedVaultInviteType
  permissions: SharedVaultPermission
}
