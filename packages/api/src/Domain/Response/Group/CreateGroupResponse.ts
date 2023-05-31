import { GroupUserServerHash, GroupServerHash } from '@standardnotes/responses'

export type CreateGroupResponse = {
  group: GroupServerHash
  groupUser: GroupUserServerHash
}
