import { StorageServiceInterface } from '../Storage/StorageServiceInterface'
import { StorageKey } from '../Storage/StorageKeys'
import { GroupServerHash } from '@standardnotes/responses'
import { GroupCacheServiceInterface } from './GroupCacheServiceInterface'

export class GroupCacheService implements GroupCacheServiceInterface {
  constructor(private storage: StorageServiceInterface) {}

  setGroups(groups: GroupServerHash[]): void {
    this.storage.setValue(StorageKey.GroupsCache, groups)
  }

  updateGroups(groups: GroupServerHash[]): void {
    for (const group of groups) {
      this.setGroup(group)
    }
  }

  getGroups(): GroupServerHash[] {
    const result = this.storage.getValue<GroupServerHash[]>(StorageKey.GroupsCache)
    return result ? result : []
  }

  setGroup(group: GroupServerHash): void {
    const groups = this.getGroups()
    const index = groups.findIndex((g) => g.uuid === group.uuid)
    if (index !== -1) {
      groups[index] = group
    } else {
      groups.push(group)
    }
    this.setGroups(groups)
  }

  getGroup(groupUuid: string): GroupServerHash | undefined {
    const groups = this.getGroups()
    return groups.find((group) => group.uuid === groupUuid)
  }

  getGroupForVaultSystemIdentifier(systemIdentifier: string): GroupServerHash | undefined {
    const groups = this.getGroups()
    return groups.find((group) => group.vault_system_identifier === systemIdentifier)
  }

  getVaultSystemIdentifierForGroup(groupUuid: string): string | undefined {
    const group = this.getGroup(groupUuid)
    return group ? group.vault_system_identifier : undefined
  }
}
