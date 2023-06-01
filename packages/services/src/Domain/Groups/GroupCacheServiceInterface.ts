import { GroupServerHash } from '@standardnotes/responses'

export interface GroupCacheServiceInterface {
  setGroups(groups: GroupServerHash[]): void
  updateGroups(groups: GroupServerHash[]): void
  getGroups(): GroupServerHash[]
  setGroup(group: GroupServerHash): void
  getGroup(groupUuid: string): GroupServerHash | undefined
  getGroupForVaultSystemIdentifier(systemIdentifier: string): GroupServerHash | undefined
  getVaultSystemIdentifierForGroup(groupUuid: string): string | undefined
}
