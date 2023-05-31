import { GroupPermission } from '@standardnotes/responses'

export type UpdateGroupInviteParams = {
  groupUuid: string
  inviteUuid: string
  inviterPublicKey: string
  encryptedVaultKeyContent: string
  permissions?: GroupPermission
}
