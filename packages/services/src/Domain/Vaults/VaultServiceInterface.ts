import { ClientDisplayableError, VaultUserServerHash } from '@standardnotes/responses'
import {
  DecryptedItemInterface,
  VaultKeyInterface,
  VaultKeyContentSpecialized,
  VaultInterface,
} from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { VaultServiceEvent } from './VaultServiceEvent'

export interface VaultServiceInterface extends AbstractService<VaultServiceEvent> {
  createVault(name?: string, description?: string): Promise<VaultInterface | ClientDisplayableError>
  reloadRemoteVaults(): Promise<VaultInterface[] | ClientDisplayableError>
  getVaults(): VaultInterface[]
  deleteVault(vaultUuid: string): Promise<boolean>

  getVaultKey(vaultUuid: string): VaultKeyInterface | undefined
  getVaultInfoForItem(item: DecryptedItemInterface): VaultKeyContentSpecialized | undefined
  getVaultInfo(vaultUuid: string): VaultKeyContentSpecialized | undefined
  isUserVaultAdmin(vaultUuid: string): boolean
  isVaultUserOwnUser(user: VaultUserServerHash): boolean

  addItemToVault(vault: VaultInterface, item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  moveItemFromVaultToUser(item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  isItemInVault(item: DecryptedItemInterface): boolean

  rotateVaultKey(vaultUuid: string): Promise<void>
  changeVaultNameAndDescription(
    vaultUuid: string,
    params: { name: string; description: string },
  ): Promise<VaultKeyInterface>
}
