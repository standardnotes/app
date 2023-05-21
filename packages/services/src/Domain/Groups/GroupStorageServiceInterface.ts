import { GroupServerHash } from '@standardnotes/responses'

export interface GroupStorageServiceInterface {
  setGroups(groups: GroupServerHash[]): void
  setGroup(group: GroupServerHash): void
  getGroups(): GroupServerHash[]
  getGroup(groupUuid: string): GroupServerHash | undefined
}
