import { GroupPermission } from '@standardnotes/responses'

export type UpdateGroupInviteParams = {
  groupUuid: string
  inviteUuid: string
  inviterPublicKey: string
  encryptedGroupKey: string
  permissions?: GroupPermission
}
