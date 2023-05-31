import { AddContactToVaultUseCase } from './UseCase/AddContactToVault'
import {
  ClientDisplayableError,
  VaultInviteServerHash,
  User,
  isErrorResponse,
  VaultUserServerHash,
  isClientDisplayableError,
  VaultPermission,
} from '@standardnotes/responses'
import {
  HttpServiceInterface,
  VaultsServerInterface,
  VaultUsersServerInterface,
  VaultInvitesServerInterface,
  VaultUsersServer,
  VaultInvitesServer,
} from '@standardnotes/api'
import {
  DecryptedItemInterface,
  VaultKeyContentSpecialized,
  PayloadEmitSource,
  TrustedContactInterface,
  VaultInterface,
} from '@standardnotes/models'
import { VaultCollaborationServiceInterface } from './VaultCollaborationServiceInterface'
import { VaultCollaborationServiceEvent, VaultCollaborationServiceEventPayload } from './VaultCollaborationServiceEvent'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ContentType } from '@standardnotes/common'
import { HandleSuccessfullyChangedCredentials } from './UseCase/HandleSuccessfullyChangedCredentials'
import { SuccessfullyChangedCredentialsEventData } from '../Session/SuccessfullyChangedCredentialsEventData'
import { AcceptInvite } from './UseCase/AcceptInvite'
import { GetVaultUsersUseCase } from './UseCase/GetVaultUsers'
import { RemoveVaultMemberUseCase } from './UseCase/RemoveVaultMember'
import { AbstractService } from '../Service/AbstractService'
import { InternalEventHandlerInterface } from '../Internal/InternalEventHandlerInterface'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { SessionsClientInterface } from '../Session/SessionsClientInterface'
import { ContactServiceInterface } from '../Contacts/ContactServiceInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { SyncEvent, SyncEventReceivedVaultInvitesData } from '../Event/SyncEvent'
import { SessionEvent } from '../Session/SessionEvent'
import { InternalEventInterface } from '../Internal/InternalEventInterface'
import { FilesClientInterface } from '@standardnotes/files'
import { ReloadRemovedUseCase } from './UseCase/ReloadRemovedVaults'
import { LeaveVaultUseCase } from './UseCase/LeaveVault'
import { VaultStorageServiceInterface } from '../VaultStorage/VaultStorageServiceInterface'
import { UpdateInvitesAfterVaultDataChangeUseCase } from './UseCase/UpdateInvitesAfterVaultDataChange'
import { ApplicationStage } from '../Application/ApplicationStage'

export class VaultCollaborationService
  extends AbstractService<VaultCollaborationServiceEvent, VaultCollaborationServiceEventPayload>
  implements VaultCollaborationServiceInterface, InternalEventHandlerInterface
{
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
    private vaultsServer: VaultsServerInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)
    eventBus.addEventHandler(this, SessionEvent.SuccessfullyChangedCredentials)

    this.vaultUsersServer = new VaultUsersServer(http)
    this.vaultInvitesServer = new VaultInvitesServer(http)

    this.syncEventDisposer = sync.addEventObserver(async (event, data) => {
      if (event === SyncEvent.ReceivedVaultInvites) {
        await this.processInboundInvites(data as SyncEventReceivedVaultInvitesData)
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

  public override async handleApplicationStage(stage: ApplicationStage): Promise<void> {
    if (stage === ApplicationStage.Launched_10) {
      void this.reloadRemovedVaults()
    }
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === SessionEvent.SuccessfullyChangedCredentials) {
      const handler = new HandleSuccessfullyChangedCredentials(this.vaultInvitesServer, this.encryption, this.contacts)
      await handler.execute(event.payload as SuccessfullyChangedCredentialsEventData)
    }
  }

  public getCachedInboundInvites(): VaultInviteServerHash[] {
    return Object.values(this.pendingInvites)
  }

  public isUserVaultAdmin(vaultUuid: string): boolean {
    const vault = this.vaultStorage.getVault(vaultUuid)

    if (!vault || !vault.userUuid) {
      return false
    }

    return vault.userUuid === this.session.userUuid
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

    await this.notifyCollaborationStatusChanged()
  }

  private async notifyCollaborationStatusChanged(): Promise<void> {
    await this.notifyEventSync(VaultCollaborationServiceEvent.VaultCollaborationStatusChanged)
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

  public reloadRemovedVaults(): Promise<void> {
    const useCase = new ReloadRemovedUseCase(this.vaultsServer, this.items)

    return useCase.execute()
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

  public async getInvitableContactsForVault(vault: VaultInterface): Promise<TrustedContactInterface[]> {
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
    vault: VaultInterface,
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

    void this.notifyCollaborationStatusChanged()

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

  async removeUserFromVault(vaultUuid: string, userUuid: string): Promise<ClientDisplayableError | void> {
    if (!this.isUserVaultAdmin(vaultUuid)) {
      throw new Error('Only vault admins can remove users')
    }

    const useCase = new RemoveVaultMemberUseCase(this.vaultUsersServer)
    const result = await useCase.execute({ vaultUuid, userUuid })

    if (isClientDisplayableError(result)) {
      return result
    }

    void this.notifyCollaborationStatusChanged()

    await this.notifyEventSync(VaultCollaborationServiceEvent.VaultMemberRemoved, { vaultUuid })
  }

  async leaveVault(vaultUuid: string): Promise<ClientDisplayableError | void> {
    const vault = this.vaultStorage.getVault(vaultUuid)
    if (!vault) {
      return ClientDisplayableError.FromString('Vault not found')
    }

    if (vault.userUuid && vault.userUuid === this.user.uuid) {
      return ClientDisplayableError.FromString('Cannot leave vault as owner')
    }

    const useCase = new LeaveVaultUseCase(this.vaultUsersServer, this.items)
    const result = await useCase.execute({ vaultUuid, userUuid: this.user.uuid })

    if (isClientDisplayableError(result)) {
      return result
    }

    void this.notifyCollaborationStatusChanged()
  }

  async getVaultUsers(vaultUuid: string): Promise<VaultUserServerHash[] | undefined> {
    const useCase = new GetVaultUsersUseCase(this.vaultUsersServer)
    return useCase.execute({ vaultUuid })
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

  public updateInvitesAfterVaultDataChange(vaultUuid: string): Promise<ClientDisplayableError[]> {
    const useCase = new UpdateInvitesAfterVaultDataChangeUseCase(
      this.encryption,
      this.vaultInvitesServer,
      this.vaultUsersServer,
      this.contacts,
    )

    return useCase.execute({
      vaultUuid,
      inviterUuid: this.user.uuid,
      inviterPrivateKey: this.userDecryptedPrivateKey,
      inviterPublicKey: this.userPublicKey,
    })
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
