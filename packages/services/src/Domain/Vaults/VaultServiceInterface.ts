import {
  ClientDisplayableError,
  VaultServerHash,
  VaultInviteServerHash,
  VaultUserServerHash,
  VaultPermission,
} from '@standardnotes/responses'
import {
  TrustedContact,
  DecryptedItemInterface,
  VaultKeyInterface,
  VaultKeyContentSpecialized,
  TrustedContactInterface,
} from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { VaultServiceEvent } from './VaultServiceEvent'

export interface VaultServiceInterface extends AbstractService<VaultServiceEvent> {
  createVault(name?: string, description?: string): Promise<VaultServerHash | ClientDisplayableError>
  reloadVaults(): Promise<VaultServerHash[] | ClientDisplayableError>
  getVaults(): VaultServerHash[]
  deleteVault(vaultUuid: string): Promise<boolean>

  getVaultKey(vaultUuid: string): VaultKeyInterface | undefined
  getVaultInfoForItem(item: DecryptedItemInterface): VaultKeyContentSpecialized | undefined
  getVaultInfo(vaultUuid: string): VaultKeyContentSpecialized | undefined
  isUserVaultAdmin(vaultUuid: string): boolean

  inviteContactToVault(
    vault: VaultServerHash,
    contact: TrustedContact,
    permissions: VaultPermission,
  ): Promise<VaultInviteServerHash | ClientDisplayableError>
  removeUserFromVault(vaultUuid: string, userUuid: string): Promise<ClientDisplayableError | void>
  leaveVault(vaultUuid: string): Promise<ClientDisplayableError | void>
  getVaultUsers(vaultUuid: string): Promise<VaultUserServerHash[] | undefined>
  isVaultUserOwnUser(user: VaultUserServerHash): boolean

  addItemToVault(vault: VaultServerHash, item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  removeItemFromItsVault(item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  removeItemFromItsVault(item: DecryptedItemInterface): Promise<DecryptedItemInterface>
  getItemLastEditedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined
  getItemSharedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined
  isItemInCollaborativeVault(item: DecryptedItemInterface): boolean

  downloadInboundInvites(): Promise<ClientDisplayableError | VaultInviteServerHash[]>
  getOutboundInvites(vaultUuid?: string): Promise<VaultInviteServerHash[] | ClientDisplayableError>
  getTrustedSenderOfInvite(invite: VaultInviteServerHash): TrustedContactInterface | undefined
  acceptInvite(invite: VaultInviteServerHash): Promise<boolean>
  getInviteData(invite: VaultInviteServerHash): VaultKeyContentSpecialized | undefined
  getCachedInboundInvites(): VaultInviteServerHash[]
  getInvitableContactsForVault(vault: VaultServerHash): Promise<TrustedContactInterface[]>
  deleteInvite(invite: VaultInviteServerHash): Promise<ClientDisplayableError | void>

  rotateVaultKey(vaultUuid: string): Promise<void>
  changeVaultMetadata(
    vaultUuid: string,
    params: { name: string; description: string },
  ): Promise<ClientDisplayableError[] | undefined>
}
