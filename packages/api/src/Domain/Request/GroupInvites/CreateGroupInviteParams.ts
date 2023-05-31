import { GroupInviteType, GroupPermission } from '@standardnotes/responses'

export type CreateGroupInviteParams = {
  groupUuid: string
  inviteeUuid: string
  inviterPublicKey: string
  encryptedVaultKeyContent: string
  inviteType: GroupInviteType
  permissions: GroupPermission
}
