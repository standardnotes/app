import { ClientDisplayableError, GroupUserServerHash } from '@standardnotes/responses'
import {
  DecryptedItemInterface,
  VaultKeyCopyInterface,
  VaultKeyCopyContentSpecialized,
  VaultInterface,
} from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { VaultServiceEvent } from './VaultServiceEvent'

export interface VaultServiceInterface extends AbstractService<VaultServiceEvent> {
  createVault(name?: string, description?: string): Promise<VaultInterface | ClientDisplayableError>
  reloadRemoteVaults(): Promise<VaultInterface[] | ClientDisplayableError>
  getVaults(): VaultInterface[]
  deleteVault(vaultSystemIdentifier: string): Promise<boolean>

  getPrimarySyncedVaultKeyCopy(vaultSystemIdentifier: string): VaultKeyCopyInterface | undefined
  getVaultInfoForItem(item: DecryptedItemInterface): VaultKeyCopyContentSpecialized | undefined
  getVaultInfo(vaultSystemIdentifier: string): VaultKeyCopyContentSpecialized | undefined
  isUserGroupAdmin(vaultSystemIdentifier: string): boolean
  isGroupUserOwnUser(user: GroupUserServerHash): boolean

  addItemToVault(vault: VaultInterface, item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  moveItemFromVaultToUser(item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  isItemInVault(item: DecryptedItemInterface): boolean

  rotateVaultKey(vaultSystemIdentifier: string): Promise<void>
  changeVaultNameAndDescription(
    vaultSystemIdentifier: string,
    params: { name: string; description: string },
  ): Promise<VaultKeyCopyInterface>
}
