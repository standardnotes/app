import {
  VaultCollaborationServiceEvent,
  VaultCollaborationServiceEventPayload,
} from './../VaultCollaboration/VaultCollaborationServiceEvent'
import { UpdateServerVaultUseCase } from './UseCase/UpdateServerVault'
import {
  ClientDisplayableError,
  VaultServerHash,
  isErrorResponse,
  VaultUserServerHash,
  isClientDisplayableError,
} from '@standardnotes/responses'
import { HttpServiceInterface, VaultsServer, VaultsServerInterface } from '@standardnotes/api'
import {
  DecryptedItemInterface,
  VaultKeyContentSpecialized,
  VaultKeyInterface,
  VaultInterface,
  VaultInterfaceFromServerHash,
} from '@standardnotes/models'
import { VaultServiceInterface } from './VaultServiceInterface'
import { VaultServiceEvent } from './VaultServiceEvent'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { CreateVaultUseCase } from './UseCase/CreateVault'
import { RotateVaultKeyUseCase } from './UseCase/RotateVaultKey'
import { AbstractService } from '../Service/AbstractService'
import { InternalEventHandlerInterface } from '../Internal/InternalEventHandlerInterface'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { SessionsClientInterface } from '../Session/SessionsClientInterface'
import { ContactServiceInterface } from '../Contacts/ContactServiceInterface'
import { VaultStorageServiceInterface } from '../VaultStorage/VaultStorageServiceInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { SyncEvent, SyncEventReceivedVaultsData } from '../Event/SyncEvent'
import { InternalEventInterface } from '../Internal/InternalEventInterface'
import { MoveItemFromVaultToUser } from './UseCase/MoveItemFromVaultToUser'
import { DeleteVaultUseCase } from './UseCase/DeleteVault'
import { AddItemToVaultUseCase } from './UseCase/AddItemToVault'
import { FilesClientInterface } from '@standardnotes/files'
import { VaultCollaborationServiceInterface } from '../VaultCollaboration/VaultCollaborationServiceInterface'
import { VaultCollaborationService } from '../VaultCollaboration/VaultCollaborationService'
import { ChangeVaultKeyDataUseCase } from './UseCase/ChangeVaultKeyData'

export class VaultService
  extends AbstractService<VaultServiceEvent>
  implements VaultServiceInterface, InternalEventHandlerInterface
{
  public readonly collaboration: VaultCollaborationServiceInterface
  private vaultsServer: VaultsServerInterface
  private syncEventDisposer: () => void

  constructor(
    private http: HttpServiceInterface,
    private sync: SyncServiceInterface,
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
    private session: SessionsClientInterface,
    private contacts: ContactServiceInterface,
    private vaultStorage: VaultStorageServiceInterface,
    private files: FilesClientInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    eventBus.addEventHandler(this, VaultCollaborationServiceEvent.VaultCollaborationStatusChanged)
    eventBus.addEventHandler(this, VaultCollaborationServiceEvent.VaultMemberRemoved)

    this.vaultsServer = new VaultsServer(http)

    this.collaboration = new VaultCollaborationService(
      http,
      sync,
      items,
      encryption,
      session,
      contacts,
      vaultStorage,
      files,
      this.vaultsServer,
      eventBus,
    )

    this.syncEventDisposer = sync.addEventObserver(async (event, data) => {
      if (event === SyncEvent.ReceivedVaults) {
        await this.handleReceivedVaults(data as SyncEventReceivedVaultsData)
        this.notifyVaultsChangedEvent()
      }
    })
  }

  private notifyVaultsChangedEvent(): void {
    void this.notifyEvent(VaultServiceEvent.VaultsChanged)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === VaultCollaborationServiceEvent.VaultCollaborationStatusChanged) {
      this.notifyVaultsChangedEvent()
    } else if (event.type === VaultCollaborationServiceEvent.VaultMemberRemoved) {
      await this.handleVaultMemberRemovedEvent((event.payload as VaultCollaborationServiceEventPayload).vaultUuid)
    }
  }

  private async handleVaultMemberRemovedEvent(vaultUuid: string): Promise<void> {
    await this.rotateVaultKey(vaultUuid)
  }

  public async reloadVaults(): Promise<VaultInterface[] | ClientDisplayableError> {
    const response = await this.vaultsServer.getVaults()

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to get vaults ${response}`)
    }

    const serverVaults = response.data.vaults

    const vaults = await this.handleReceivedVaults(serverVaults)

    return vaults
  }

  async handleReceivedVaults(serverHashes: VaultServerHash[]): Promise<VaultInterface[]> {
    const vaults = serverHashes.map((serverHash) => VaultInterfaceFromServerHash(serverHash))

    this.vaultStorage.updateVaults(vaults)

    return vaults
  }

  public getVaults(): VaultInterface[] {
    return this.vaultStorage.getVaults()
  }

  public getVault(vaultUuid: string): VaultInterface | undefined {
    return this.vaultStorage.getVault(vaultUuid)
  }

  public isUserVaultAdmin(vaultUuid: string): boolean {
    const vault = this.getVault(vaultUuid)

    if (!vault || !vault.userUuid) {
      return false
    }

    return vault.userUuid === this.session.userUuid
  }

  public isVaultUserOwnUser(user: VaultUserServerHash): boolean {
    return user.user_uuid === this.session.userUuid
  }

  async createVault(name?: string, description?: string): Promise<VaultInterface | ClientDisplayableError> {
    const createVault = new CreateVaultUseCase(this.items, this.vaultsServer, this.encryption)
    const result = await createVault.execute({
      online: this.session.isSignedIn(),
      vaultName: name,
      vaultDescription: description,
    })

    this.notifyVaultsChangedEvent()

    if (!isClientDisplayableError(result)) {
      await this.sync.sync()
      return result
    } else {
      return result
    }
  }

  async addItemToVault(vault: VaultInterface, item: DecryptedItemInterface): Promise<DecryptedItemInterface> {
    const useCase = new AddItemToVaultUseCase(this.items, this.sync, this.files)
    await useCase.execute({ vaultUuid: vault.uuid, item })

    return this.items.findSureItem(item.uuid)
  }

  async moveItemFromVaultToUser(item: DecryptedItemInterface): Promise<DecryptedItemInterface> {
    const useCase = new MoveItemFromVaultToUser(this.items, this.sync, this.files)
    await useCase.execute({ item })

    return this.items.findSureItem(item.uuid)
  }

  async deleteVault(vaultUuid: string): Promise<boolean> {
    const useCase = new DeleteVaultUseCase(this.items, this.vaultsServer)
    const error = await useCase.execute({ vaultUuid })

    if (isClientDisplayableError(error)) {
      return false
    }

    this.notifyVaultsChangedEvent()

    await this.sync.sync()
    return true
  }

  getVaultKey(vaultUuid: string): VaultKeyInterface | undefined {
    return this.encryption.getVaultKey(vaultUuid)
  }

  getVaultInfoForItem(item: DecryptedItemInterface): VaultKeyContentSpecialized | undefined {
    if (!item.vault_uuid) {
      return undefined
    }

    return this.getVaultInfo(item.vault_uuid)
  }

  getVaultInfo(vaultUuid: string): VaultKeyContentSpecialized | undefined {
    return this.getVaultKey(vaultUuid)?.content
  }

  async updateServerVaultWithNewKeyInformation(
    vaultUuid: string,
    params: { specifiedItemsKeyUuid: string; vaultKeyTimestamp: number },
  ): Promise<VaultInterface | ClientDisplayableError> {
    const useCase = new UpdateServerVaultUseCase(this.vaultsServer)
    const result = await useCase.execute({
      vaultUuid: vaultUuid,
      vaultKeyTimestamp: params.vaultKeyTimestamp,
      specifiedItemsKeyUuid: params.specifiedItemsKeyUuid,
    })

    this.notifyVaultsChangedEvent()

    return result
  }

  async changeVaultNameAndDescription(
    vaultUuid: string,
    params: { name: string; description: string },
  ): Promise<VaultKeyInterface> {
    const vaultKey = this.encryption.getVaultKey(vaultUuid)
    if (!vaultKey) {
      throw new Error('Cannot change vault metadata; vault key not found')
    }

    const newVaultContent: VaultKeyContentSpecialized = {
      ...vaultKey.content,
      vaultName: params.name,
      vaultDescription: params.description,
    }

    const changeVaultDataUseCase = new ChangeVaultKeyDataUseCase(this.items, this.encryption)
    const updatedKey = await changeVaultDataUseCase.execute({
      vaultUuid: vaultUuid,
      newVaultData: newVaultContent,
    })

    await this.sync.sync()

    this.notifyVaultsChangedEvent()

    await this.collaboration.updateInvitesAfterVaultDataChange(vaultUuid)

    return updatedKey
  }

  async rotateVaultKey(vaultUuid: string): Promise<void> {
    const useCase = new RotateVaultKeyUseCase(this.items, this.encryption, this.vaultsServer, this.vaultStorage)
    await useCase.execute({
      online: this.session.isSignedIn(),
      vaultUuid,
    })

    this.notifyVaultsChangedEvent()

    await this.collaboration.updateInvitesAfterVaultDataChange(vaultUuid)
    await this.sync.sync()
  }

  isItemInVault(item: DecryptedItemInterface): boolean {
    return item.vault_uuid !== undefined
  }

  override deinit(): void {
    super.deinit()
    ;(this.http as unknown) = undefined
    ;(this.sync as unknown) = undefined
    ;(this.encryption as unknown) = undefined
    ;(this.items as unknown) = undefined
    ;(this.session as unknown) = undefined
    ;(this.vaultsServer as unknown) = undefined
    ;(this.contacts as unknown) = undefined
    ;(this.files as unknown) = undefined
    this.syncEventDisposer()
  }
}
