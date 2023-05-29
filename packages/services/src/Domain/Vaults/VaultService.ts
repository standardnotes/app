import { UpdateVaultUseCase } from './UseCase/UpdateVault'
import { AddContactToVaultUseCase } from './UseCase/AddContactToVault'
import {
  ClientDisplayableError,
  VaultInviteServerHash,
  VaultServerHash,
  User,
  isErrorResponse,
  VaultUserServerHash,
  isClientDisplayableError,
  VaultPermission,
} from '@standardnotes/responses'
import {
  HttpServiceInterface,
  VaultsServer,
  VaultsServerInterface,
  VaultUsersServerInterface,
  VaultInvitesServerInterface,
  VaultUsersServer,
  VaultInvitesServer,
} from '@standardnotes/api'
import {
  DecryptedItemInterface,
  VaultKeyContentSpecialized,
  VaultKeyInterface,
  PayloadEmitSource,
  TrustedContactInterface,
} from '@standardnotes/models'
import { VaultServiceInterface } from './VaultServiceInterface'
import { VaultServiceEvent } from './VaultServiceEvent'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ContentType } from '@standardnotes/common'
import { HandleSuccessfullyChangedCredentials } from './UseCase/HandleSuccessfullyChangedCredentials'
import { SuccessfullyChangedCredentialsEventData } from '../Session/SuccessfullyChangedCredentialsEventData'
import { AcceptInvite } from './UseCase/AcceptInvite'
import { CreateVaultUseCase } from './UseCase/CreateVault'
import { RotateVaultKeyUseCase } from './UseCase/RotateVaultKey'
import { GetVaultUsersUseCase } from './UseCase/GetVaultUsers'
import { RemoveVaultMemberUseCase } from './UseCase/RemoveVaultMember'
import { AbstractService } from '../Service/AbstractService'
import { InternalEventHandlerInterface } from '../Internal/InternalEventHandlerInterface'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { SessionsClientInterface } from '../Session/SessionsClientInterface'
import { ContactServiceInterface } from '../Contacts/ContactServiceInterface'
import { VaultStorageServiceInterface } from './VaultStorageServiceInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { SyncEvent, SyncEventReceivedVaultInvitesData, SyncEventReceivedVaultsData } from '../Event/SyncEvent'
import { SessionEvent } from '../Session/SessionEvent'
import { InternalEventInterface } from '../Internal/InternalEventInterface'
import { RemoveItemFromVaultUseCase } from './UseCase/RemoveItemFromVault'
import { DeleteVaultUseCase } from './UseCase/DeleteVault'
import { AddItemToVaultUseCase } from './UseCase/AddItemToVault'
import { ChangeVaultMetadataUsecase } from './UseCase/ChangeVaultMetadata'
import { FilesClientInterface } from '@standardnotes/files'

export class VaultService
  extends AbstractService<VaultServiceEvent>
  implements VaultServiceInterface, InternalEventHandlerInterface
{
  private vaultsServer: VaultsServerInterface
  private vaultUsersServer: VaultUsersServerInterface
  private vaultInvitesServer: VaultInvitesServerInterface

  private syncEventDisposer: () => void
  private itemsEventDisposer: () => void

  private pendingInvites: Record<string, VaultInviteServerHash> = {}

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
    eventBus.addEventHandler(this, SessionEvent.SuccessfullyChangedCredentials)

    this.vaultsServer = new VaultsServer(http)
    this.vaultUsersServer = new VaultUsersServer(http)
    this.vaultInvitesServer = new VaultInvitesServer(http)

    this.syncEventDisposer = sync.addEventObserver(async (event, data) => {
      if (event === SyncEvent.ReceivedVaultInvites) {
        await this.processInboundInvites(data as SyncEventReceivedVaultInvitesData)
        this.notifyVaultsChangedEvent()
      }
      if (event === SyncEvent.ReceivedVaults) {
        await this.handleReceivedVaults(data as SyncEventReceivedVaultsData)
        this.notifyVaultsChangedEvent()
      }
    })
    this.itemsEventDisposer = items.addObserver<TrustedContactInterface>(
      ContentType.TrustedContact,
      ({ inserted, source }) => {
        if (source === PayloadEmitSource.LocalChanged && inserted.length > 0) {
          void this.handleCreationOfNewTrustedContacts(inserted)
        }
      },
    )
  }

  private notifyVaultsChangedEvent(): void {
    void this.notifyEvent(VaultServiceEvent.VaultsChanged)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === SessionEvent.SuccessfullyChangedCredentials) {
      const handler = new HandleSuccessfullyChangedCredentials(this.vaultInvitesServer, this.encryption, this.contacts)
      await handler.execute(event.payload as SuccessfullyChangedCredentialsEventData)
    }
  }

  async handleReceivedVaults(vaults: VaultServerHash[]): Promise<void> {
    this.vaultStorage.updateVaults(vaults)
  }

  public async reloadVaults(): Promise<VaultServerHash[] | ClientDisplayableError> {
    const response = await this.vaultsServer.getVaults()

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to get vaults ${response}`)
    }

    const vaults = response.data.vaults

    await this.handleReceivedVaults(vaults)

    return vaults
  }

  public getVaults(): VaultServerHash[] {
    return this.vaultStorage.getVaults()
  }

  public getVault(vaultUuid: string): VaultServerHash | undefined {
    return this.vaultStorage.getVault(vaultUuid)
  }

  public getCachedInboundInvites(): VaultInviteServerHash[] {
    return Object.values(this.pendingInvites)
  }

  public isUserVaultAdmin(vaultUuid: string): boolean {
    const vault = this.getVault(vaultUuid)

    if (!vault) {
      return false
    }

    return vault.user_uuid === this.session.userUuid
  }

  public isVaultUserOwnUser(user: VaultUserServerHash): boolean {
    return user.user_uuid === this.session.userUuid
  }

  private async handleCreationOfNewTrustedContacts(_contacts: TrustedContactInterface[]): Promise<void> {
    await this.downloadInboundInvites()
  }

  public async downloadInboundInvites(): Promise<ClientDisplayableError | VaultInviteServerHash[]> {
    const response = await this.vaultInvitesServer.getInboundUserInvites()

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to get inbound user invites ${response}`)
    }

    this.pendingInvites = {}

    await this.processInboundInvites(response.data.invites)

    return response.data.invites
  }

  public async getOutboundInvites(vaultUuid?: string): Promise<VaultInviteServerHash[] | ClientDisplayableError> {
    const response = await this.vaultInvitesServer.getOutboundUserInvites()

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to get outbound user invites ${response}`)
    }

    if (vaultUuid) {
      return response.data.invites.filter((invite) => invite.vault_uuid === vaultUuid)
    }

    return response.data.invites
  }

  public async deleteInvite(invite: VaultInviteServerHash): Promise<ClientDisplayableError | void> {
    const response = await this.vaultInvitesServer.deleteInvite({
      vaultUuid: invite.vault_uuid,
      inviteUuid: invite.uuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to delete invite ${response}`)
    }

    delete this.pendingInvites[invite.uuid]
  }

  private async processInboundInvites(invites: VaultInviteServerHash[]): Promise<void> {
    if (invites.length === 0) {
      return
    }

    for (const invite of invites) {
      this.pendingInvites[invite.uuid] = invite
    }

    await this.automaticallyAcceptTrustedKeyChangeInvites()

    await this.notifyEventSync(VaultServiceEvent.DidResolveRemoteVaultInvites)
  }

  private async automaticallyAcceptTrustedKeyChangeInvites(): Promise<void> {
    const trustedKeyChangeInvites = this.getCachedInboundInvites().filter((invite) => {
      return this.getTrustedSenderOfInvite(invite) && invite.invite_type === 'key-change'
    })

    if (trustedKeyChangeInvites.length > 0) {
      for (const invite of trustedKeyChangeInvites) {
        await this.acceptInvite(invite)
      }
    }
  }

  async acceptInvite(invite: VaultInviteServerHash): Promise<boolean> {
    if (!this.getTrustedSenderOfInvite(invite)) {
      return false
    }

    const useCase = new AcceptInvite(this.userDecryptedPrivateKey, this.vaultInvitesServer, this.items, this.encryption)

    const result = await useCase.execute(invite)

    if (result === 'errored') {
      return false
    }

    delete this.pendingInvites[invite.uuid]

    void this.sync.sync()

    await this.decryptErroredItemsForVault(invite.vault_uuid)

    if (result === 'inserted') {
      void this.syncVaultFromScratch(invite.vault_uuid)
    }

    return true
  }

  public getTrustedSenderOfInvite(invite: VaultInviteServerHash): TrustedContactInterface | undefined {
    const trustedContact = this.contacts.findTrustedContact(invite.inviter_uuid)
    if (trustedContact && trustedContact.publicKey === invite.inviter_public_key) {
      return trustedContact
    }
    return undefined
  }

  private async decryptErroredItemsForVault(_vaultUuid: string): Promise<void> {
    await this.encryption.decryptErroredPayloads()
  }

  private async syncVaultFromScratch(vaultUuid: string): Promise<void> {
    if (vaultUuid.length === 0) {
      return
    }

    await this.sync.syncVaultsFromScratch([vaultUuid])
  }

  get user(): User {
    return this.session.getSureUser()
  }

  get userPublicKey(): string {
    const publicKey = this.session.getPublicKey()
    if (!publicKey) {
      throw new Error('Public key not found')
    }
    return publicKey
  }

  get userDecryptedPrivateKey(): string {
    const key = this.encryption.getDecryptedPrivateKey()
    if (!key) {
      throw new Error('Decrypted private key not found')
    }

    return key
  }

  async createVault(name?: string, description?: string): Promise<VaultServerHash | ClientDisplayableError> {
    const createVault = new CreateVaultUseCase(this.items, this.vaultsServer, this.encryption)
    const result = await createVault.execute({
      vaultName: name,
      vaultDescription: description,
    })

    this.notifyVaultsChangedEvent()

    if (!isClientDisplayableError(result)) {
      await this.sync.sync()
    }

    return result
  }

  public async getInvitableContactsForVault(vault: VaultServerHash): Promise<TrustedContactInterface[]> {
    const users = await this.getVaultUsers(vault.uuid)
    if (!users) {
      return []
    }

    const contacts = this.contacts.getAllContacts()
    return contacts.filter((contact) => {
      const isContactAlreadyInVault = users.some((user) => user.user_uuid === contact.contactUuid)
      return !isContactAlreadyInVault
    })
  }

  async inviteContactToVault(
    vault: VaultServerHash,
    contact: TrustedContactInterface,
    permissions: VaultPermission,
  ): Promise<VaultInviteServerHash | ClientDisplayableError> {
    const useCase = new AddContactToVaultUseCase(this.encryption, this.vaultInvitesServer)

    const result = await useCase.execute({
      inviterPrivateKey: this.userDecryptedPrivateKey,
      inviterPublicKey: this.userPublicKey,
      vault,
      contact,
      permissions,
    })

    this.notifyVaultsChangedEvent()

    await this.sync.sync()

    return result
  }

  public getInviteData(invite: VaultInviteServerHash): VaultKeyContentSpecialized | undefined {
    return this.encryption.decryptVaultDataWithPrivateKey(
      invite.encrypted_vault_data,
      invite.inviter_public_key,
      this.userDecryptedPrivateKey,
    )
  }

  async addItemToVault(vault: VaultServerHash, item: DecryptedItemInterface): Promise<DecryptedItemInterface> {
    const useCase = new AddItemToVaultUseCase(this.items, this.sync, this.files)
    await useCase.execute({ vaultUuid: vault.uuid, item })

    return this.items.findSureItem(item.uuid)
  }

  async removeItemFromItsVault(item: DecryptedItemInterface): Promise<DecryptedItemInterface> {
    const useCase = new RemoveItemFromVaultUseCase(this.items, this.sync, this.files)
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

  async removeUserFromVault(vaultUuid: string, memberUuid: string): Promise<ClientDisplayableError | void> {
    if (!this.isUserVaultAdmin(vaultUuid)) {
      throw new Error('Only vault admins can remove users')
    }

    const useCase = new RemoveVaultMemberUseCase(this.vaultUsersServer)
    const result = await useCase.execute({ vaultUuid, memberUuid })

    if (isClientDisplayableError(result)) {
      return result
    }

    this.notifyVaultsChangedEvent()

    await this.rotateVaultKey(vaultUuid)
  }

  async leaveVault(vaultUuid: string): Promise<ClientDisplayableError | void> {
    const vault = this.getVault(vaultUuid)
    if (!vault) {
      throw new Error('Vault not found')
    }

    if (vault.user_uuid === this.user.uuid) {
      throw new Error('Cannot leave vault as owner')
    }

    const response = await this.vaultUsersServer.deleteVaultUser({
      vaultUuid: vaultUuid,
      userUuid: this.user.uuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to leave vault ${response}`)
    }

    this.notifyVaultsChangedEvent()
  }

  async getVaultUsers(vaultUuid: string): Promise<VaultUserServerHash[] | undefined> {
    const useCase = new GetVaultUsersUseCase(this.vaultUsersServer)
    return useCase.execute({ vaultUuid })
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

  async updateVault(
    vaultUuid: string,
    params: { specifiedItemsKeyUuid: string; vaultKeyTimestamp: number },
  ): Promise<VaultServerHash | ClientDisplayableError> {
    const updateVaultUseCase = new UpdateVaultUseCase(this.vaultsServer)

    const result = await updateVaultUseCase.execute({
      vaultUuid: vaultUuid,
      vaultKeyTimestamp: params.vaultKeyTimestamp,
      specifiedItemsKeyUuid: params.specifiedItemsKeyUuid,
    })

    this.notifyVaultsChangedEvent()

    return result
  }

  async changeVaultMetadata(
    vaultUuid: string,
    params: { name: string; description: string },
  ): Promise<ClientDisplayableError[] | undefined> {
    const changeVaultMetadataUseCase = new ChangeVaultMetadataUsecase(
      this.items,
      this.encryption,
      this.vaultInvitesServer,
      this.vaultUsersServer,
      this.contacts,
    )

    const result = await changeVaultMetadataUseCase.execute({
      vaultUuid,
      vaultName: params.name,
      vaultDescription: params.description,
      inviterUuid: this.user.uuid,
      inviterPrivateKey: this.userDecryptedPrivateKey,
      inviterPublicKey: this.userPublicKey,
    })

    if (!result || result.length === 0) {
      await this.sync.sync()
      this.notifyVaultsChangedEvent()
    }

    return result
  }

  async rotateVaultKey(vaultUuid: string): Promise<void> {
    const useCase = new RotateVaultKeyUseCase(
      this.items,
      this.encryption,
      this.vaultsServer,
      this.vaultInvitesServer,
      this.vaultUsersServer,
      this.contacts,
      this.vaultStorage,
    )

    await useCase.execute({
      vaultUuid,
      inviterUuid: this.user.uuid,
      inviterPrivateKey: this.userDecryptedPrivateKey,
      inviterPublicKey: this.userPublicKey,
    })

    this.notifyVaultsChangedEvent()

    await this.sync.sync()
  }

  isItemInCollaborativeVault(item: DecryptedItemInterface): boolean {
    return item.vault_uuid !== undefined
  }

  getItemLastEditedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined {
    if (!item.last_edited_by_uuid) {
      return undefined
    }

    const contact = this.contacts.findTrustedContact(item.last_edited_by_uuid)

    return contact
  }

  getItemSharedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined {
    if (!item.user_uuid || item.user_uuid === this.user.uuid) {
      return undefined
    }

    const contact = this.contacts.findTrustedContact(item.user_uuid)

    return contact
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
    this.itemsEventDisposer()
  }
}
