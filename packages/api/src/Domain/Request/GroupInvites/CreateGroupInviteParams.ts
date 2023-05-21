import { GroupInviteType, GroupPermission } from '@standardnotes/responses'

export type CreateGroupInviteParams = {
  groupUuid: string
  inviteeUuid: string
  inviterPublicKey: string
  encryptedGroupKey: string
  inviteType: GroupInviteType
  permissions: GroupPermission
}
