import { GroupPermission } from '../../Server/Group/GroupPermission'

export type UpdateGroupInviteParams = {
  groupUuid: string
  inviteUuid: string
  inviterPublicKey: string
  encryptedGroupKey: string
  permissions?: GroupPermission
}
