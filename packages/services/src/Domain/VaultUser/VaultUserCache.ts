import { SharedVaultUserServerHash } from '@standardnotes/responses'

type SharedVaultUuid = string

export class VaultUserCache {
  private cache = new Map<SharedVaultUuid, SharedVaultUserServerHash[]>()

  public get(sharedVaultUuid: SharedVaultUuid): SharedVaultUserServerHash[] | undefined {
    return this.cache.get(sharedVaultUuid)
  }

  public set(sharedVaultUuid: SharedVaultUuid, users: SharedVaultUserServerHash[]): void {
    this.cache.set(sharedVaultUuid, users)
  }
}
