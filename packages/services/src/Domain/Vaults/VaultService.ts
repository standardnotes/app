import { GroupServiceEvent, GroupServiceEventPayload } from './../Group/GroupServiceEvent'
import { UpdateServerVaultUseCase } from './UseCase/UpdateServerVault'
import {
  ClientDisplayableError,
  GroupServerHash,
  isErrorResponse,
  GroupUserServerHash,
  isClientDisplayableError,
} from '@standardnotes/responses'
import { HttpServiceInterface, GroupsServer, GroupsServerInterface } from '@standardnotes/api'
import {
  DecryptedItemInterface,
  VaultKeyCopyContentSpecialized,
  VaultKeyCopyInterface,
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
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { SyncEvent, SyncEventReceivedRemoteVaultsData } from '../Event/SyncEvent'
import { InternalEventInterface } from '../Internal/InternalEventInterface'
import { MoveItemFromVaultToUser } from './UseCase/MoveItemFromVaultToUser'
import { DeleteVaultUseCase } from './UseCase/DeleteVault'
import { AddItemToVaultUseCase } from './UseCase/AddItemToVault'
import { FilesClientInterface } from '@standardnotes/files'
import { GroupServiceInterface } from '../Group/GroupServiceInterface'
import { GroupService } from '../Group/GroupService'
import { ChangeVaultKeyDataUseCase } from './UseCase/ChangeVaultKeyData'

export class VaultService
  extends AbstractService<VaultServiceEvent>
  implements VaultServiceInterface, InternalEventHandlerInterface
{
  public readonly collaboration: GroupServiceInterface
  private vaultsServer: GroupsServerInterface
  private syncEventDisposer: () => void

  constructor(
    private http: HttpServiceInterface,
    private sync: SyncServiceInterface,
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
    private session: SessionsClientInterface,
    private contacts: ContactServiceInterface,
    private files: FilesClientInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    eventBus.addEventHandler(this, GroupServiceEvent.GroupStatusChanged)
    eventBus.addEventHandler(this, GroupServiceEvent.GroupMemberRemoved)

    this.vaultsServer = new GroupsServer(http)

    this.collaboration = new GroupService(
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
      if (event === SyncEvent.ReceivedRemoteVaults) {
        await this.handleIncomingRemoteVaults(data as SyncEventReceivedRemoteVaultsData)
        this.notifyVaultsChangedEvent()
      }
    })
  }

  private notifyVaultsChangedEvent(): void {
    void this.notifyEvent(VaultServiceEvent.VaultsChanged)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === GroupServiceEvent.GroupStatusChanged) {
      this.notifyVaultsChangedEvent()
    } else if (event.type === GroupServiceEvent.GroupMemberRemoved) {
      await this.handleRemoteGroupMemberRemovedEvent((event.payload as GroupServiceEventPayload).vaultUuid)
    }
  }

  private async handleRemoteGroupMemberRemovedEvent(vaultSystemIdentifier: string): Promise<void> {
    await this.rotateVaultKey(vaultUuid)
  }

  public async reloadRemoteVaults(): Promise<VaultInterface[] | ClientDisplayableError> {
    const response = await this.vaultsServer.getVaults()

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to get vaults ${response}`)
    }

    const serverVaults = response.data.vaults

    const vaults = await this.handleIncomingRemoteVaults(serverVaults)

    return vaults
  }

  async handleIncomingRemoteVaults(serverHashes: GroupServerHash[]): Promise<VaultInterface[]> {
    const vaults = serverHashes.map((serverHash) => VaultInterfaceFromServerHash(serverHash))

    this.vaultStorage.updateVaults(vaults)

    return vaults
  }

  async createVault(name?: string, description?: string): Promise<VaultInterface | ClientDisplayableError> {
    const createVault = new CreateVaultUseCase(this.items, this.vaultsServer, this.vaultStorage, this.encryption)
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
    await useCase.execute({ vaultSystemIdentifier: vault.uuid, item })

    return this.items.findSureItem(item.uuid)
  }

  async moveItemFromVaultToUser(item: DecryptedItemInterface): Promise<DecryptedItemInterface> {
    const useCase = new MoveItemFromVaultToUser(this.items, this.sync, this.files)
    await useCase.execute({ item })

    return this.items.findSureItem(item.uuid)
  }

  async deleteVault(vaultSystemIdentifier: string): Promise<boolean> {
    const useCase = new DeleteVaultUseCase(this.items, this.vaultsServer)
    const error = await useCase.execute({ vaultUuid })

    if (isClientDisplayableError(error)) {
      return false
    }

    this.notifyVaultsChangedEvent()

    await this.sync.sync()
    return true
  }

  async updateRemoteVaultWithNewKeyInformation(
    vaultSystemIdentifier: string,
    params: { specifiedItemsKeyUuid: string; vaultKeyTimestamp: number },
  ): Promise<VaultInterface | ClientDisplayableError> {
    const useCase = new UpdateServerVaultUseCase(this.vaultsServer)
    const result = await useCase.execute({
      vaultSystemIdentifier: vaultUuid,
      vaultKeyTimestamp: params.vaultKeyTimestamp,
      specifiedItemsKeyUuid: params.specifiedItemsKeyUuid,
    })

    this.notifyVaultsChangedEvent()

    return result
  }

  async changeVaultNameAndDescription(
    vaultSystemIdentifier: string,
    params: { name: string; description: string },
  ): Promise<VaultKeyCopyInterface> {
    const vaultKey = this.items.getPrimarySyncedVaultKeyCopy(vaultUuid)
    if (!vaultKey) {
      throw new Error('Cannot change vault metadata; vault key not found')
    }

    const newVaultContent: VaultKeyCopyContentSpecialized = {
      ...vaultKey.content,
      vaultName: params.name,
      vaultDescription: params.description,
    }

    const changeVaultDataUseCase = new ChangeVaultKeyDataUseCase(this.items, this.encryption)
    const updatedKey = await changeVaultDataUseCase.execute({
      vaultSystemIdentifier: vaultUuid,
      newVaultData: newVaultContent,
    })

    await this.sync.sync()

    this.notifyVaultsChangedEvent()

    await this.collaboration.updateInvitesAfterVaultKeyDataChange(vaultUuid)

    return updatedKey
  }

  async rotateVaultKey(vaultSystemIdentifier: string): Promise<void> {
    const useCase = new RotateVaultKeyUseCase(this.items, this.encryption, this.vaultsServer, this.vaultStorage)
    await useCase.execute({
      online: this.session.isSignedIn(),
      vaultUuid,
    })

    this.notifyVaultsChangedEvent()

    await this.collaboration.updateInvitesAfterVaultKeyDataChange(vaultUuid)
    await this.sync.sync()
  }

  public getVaults(): VaultInterface[] {
    return this.vaultStorage.getVaults()
  }

  public getVault(vaultSystemIdentifier: string): VaultInterface | undefined {
    return this.vaultStorage.getVault(vaultUuid)
  }

  public isUserGroupAdmin(vaultSystemIdentifier: string): boolean {
    const vault = this.getVault(vaultUuid)

    if (!vault || !vault.userUuid) {
      return false
    }

    return vault.userUuid === this.session.userUuid
  }

  public isGroupUserOwnUser(user: GroupUserServerHash): boolean {
    return user.user_uuid === this.session.userUuid
  }

  getPrimarySyncedVaultKeyCopy(vaultSystemIdentifier: string): VaultKeyCopyInterface | undefined {
    return this.items.getPrimarySyncedVaultKeyCopy(vaultUuid)
  }

  getVaultInfoForItem(item: DecryptedItemInterface): VaultKeyCopyContentSpecialized | undefined {
    if (!item.vault_system_identifier) {
      return undefined
    }

    return this.getVaultInfo(item.vault_system_identifier)
  }

  getVaultInfo(vaultSystemIdentifier: string): VaultKeyCopyContentSpecialized | undefined {
    return this.getPrimarySyncedVaultKeyCopy(vaultUuid)?.content
  }

  isItemInVault(item: DecryptedItemInterface): boolean {
    return item.vault_system_identifier !== undefined
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
