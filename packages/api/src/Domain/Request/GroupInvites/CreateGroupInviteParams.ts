import { GroupInviteType } from '@standardnotes/responses'
import { GroupPermission } from '../../Server/Group/GroupPermission'

export type CreateGroupInviteParams = {
  groupUuid: string
  inviteeUuid: string
  inviterPublicKey: string
  encryptedGroupKey: string
  inviteType: GroupInviteType
  permissions: GroupPermission
}
