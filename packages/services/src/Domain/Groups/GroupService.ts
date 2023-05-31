import { AddContactToGroupUseCase } from './UseCase/AddContactToGroup'
import {
  ClientDisplayableError,
  GroupInviteServerHash,
  User,
  isErrorResponse,
  GroupUserServerHash,
  isClientDisplayableError,
  GroupPermission,
  GroupServerHash,
} from '@standardnotes/responses'
import {
  HttpServiceInterface,
  GroupsServerInterface,
  GroupUsersServerInterface,
  GroupInvitesServerInterface,
  GroupUsersServer,
  GroupInvitesServer,
  GroupsServer,
} from '@standardnotes/api'
import {
  DecryptedItemInterface,
  VaultKeyCopyContentSpecialized,
  PayloadEmitSource,
  TrustedContactInterface,
} from '@standardnotes/models'
import { GroupServiceInterface } from './GroupServiceInterface'
import { GroupServiceEvent, GroupServiceEventPayload } from './GroupServiceEvent'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ContentType } from '@standardnotes/common'
import { HandleSuccessfullyChangedCredentials } from './UseCase/HandleSuccessfullyChangedCredentials'
import { SuccessfullyChangedCredentialsEventData } from '../Session/SuccessfullyChangedCredentialsEventData'
import { AcceptInvite } from './UseCase/AcceptInvite'
import { GetGroupUsersUseCase } from './UseCase/GetGroupUsers'
import { RemoveVaultMemberUseCase } from './UseCase/RemoveGroupMember'
import { AbstractService } from '../Service/AbstractService'
import { InternalEventHandlerInterface } from '../Internal/InternalEventHandlerInterface'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { SessionsClientInterface } from '../Session/SessionsClientInterface'
import { ContactServiceInterface } from '../Contacts/ContactServiceInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { SyncEvent, SyncEventReceivedGroupInvitesData } from '../Event/SyncEvent'
import { SessionEvent } from '../Session/SessionEvent'
import { InternalEventInterface } from '../Internal/InternalEventInterface'
import { FilesClientInterface } from '@standardnotes/files'
import { ReloadRemovedUseCase } from './UseCase/ReloadRemovedGroup'
import { LeaveVaultUseCase } from './UseCase/LeaveGroup'
import { UpdateInvitesAfterGroupDataChangeUseCase } from './UseCase/UpdateInvitesAfterGroupDataChange'
import { ApplicationStage } from '../Application/ApplicationStage'

export class GroupService
  extends AbstractService<GroupServiceEvent, GroupServiceEventPayload>
  implements GroupServiceInterface, InternalEventHandlerInterface
{
  private groupServer: GroupsServerInterface
  private groupUsersServer: GroupUsersServerInterface
  private groupInvitesServer: GroupInvitesServerInterface

  private syncEventDisposer: () => void
  private itemsEventDisposer: () => void

  private pendingInvites: Record<string, GroupInviteServerHash> = {}

  constructor(
    private http: HttpServiceInterface,
    private sync: SyncServiceInterface,
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
    private session: SessionsClientInterface,
    private contacts: ContactServiceInterface,
    private files: FilesClientInterface,
    private vaultsServer: GroupsServerInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)
    eventBus.addEventHandler(this, SessionEvent.SuccessfullyChangedCredentials)

    this.groupServer = new GroupsServer(http)
    this.groupUsersServer = new GroupUsersServer(http)
    this.groupInvitesServer = new GroupInvitesServer(http)

    this.syncEventDisposer = sync.addEventObserver(async (event, data) => {
      if (event === SyncEvent.ReceivedGroupInvites) {
        await this.processInboundInvites(data as SyncEventReceivedGroupInvitesData)
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
      const handler = new HandleSuccessfullyChangedCredentials(
        this.groupServer,
        this.groupInvitesServer,
        this.encryption,
        this.contacts,
        this.items,
      )
      await handler.execute(event.payload as SuccessfullyChangedCredentialsEventData)
    }
  }

  public getCachedInboundInvites(): GroupInviteServerHash[] {
    return Object.values(this.pendingInvites)
  }

  /**
   * @TODO
   */
  public isUserGroupAdmin(_userUuid: string): boolean {
    return false
  }

  public isGroupUserOwnUser(user: GroupUserServerHash): boolean {
    return user.user_uuid === this.session.userUuid
  }

  private async handleCreationOfNewTrustedContacts(_contacts: TrustedContactInterface[]): Promise<void> {
    await this.downloadInboundInvites()
  }

  public async downloadInboundInvites(): Promise<ClientDisplayableError | GroupInviteServerHash[]> {
    const response = await this.groupInvitesServer.getInboundUserInvites()

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to get inbound user invites ${response}`)
    }

    this.pendingInvites = {}

    await this.processInboundInvites(response.data.invites)

    return response.data.invites
  }

  public async getOutboundInvites(groupUuid?: string): Promise<GroupInviteServerHash[] | ClientDisplayableError> {
    const response = await this.groupInvitesServer.getOutboundUserInvites()

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to get outbound user invites ${response}`)
    }

    if (groupUuid) {
      return response.data.invites.filter((invite) => invite.group_uuid === groupUuid)
    }

    return response.data.invites
  }

  public async deleteInvite(invite: GroupInviteServerHash): Promise<ClientDisplayableError | void> {
    const response = await this.groupInvitesServer.deleteInvite({
      groupUuid: invite.group_uuid,
      inviteUuid: invite.uuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to delete invite ${response}`)
    }

    delete this.pendingInvites[invite.uuid]
  }

  private async processInboundInvites(invites: GroupInviteServerHash[]): Promise<void> {
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
    await this.notifyEventSync(GroupServiceEvent.GroupStatusChanged)
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

  async acceptInvite(invite: GroupInviteServerHash): Promise<boolean> {
    if (!this.getTrustedSenderOfInvite(invite)) {
      return false
    }

    const useCase = new AcceptInvite(this.userDecryptedPrivateKey, this.groupInvitesServer, this.items, this.encryption)
    const result = await useCase.execute(invite)
    if (result === 'errored') {
      return false
    }

    delete this.pendingInvites[invite.uuid]

    void this.sync.sync()

    await this.decryptErroredItemsAfterInviteAccept()

    if (result === 'inserted') {
      void this.syncGroupFromScratch(invite.group_uuid)
    }

    return true
  }

  public reloadRemovedVaults(): Promise<void> {
    const useCase = new ReloadRemovedUseCase(this.vaultsServer, this.items)

    return useCase.execute()
  }

  public getTrustedSenderOfInvite(invite: GroupInviteServerHash): TrustedContactInterface | undefined {
    const trustedContact = this.contacts.findTrustedContact(invite.inviter_uuid)
    if (trustedContact && trustedContact.publicKey === invite.inviter_public_key) {
      return trustedContact
    }
    return undefined
  }

  private async decryptErroredItemsAfterInviteAccept(): Promise<void> {
    await this.encryption.decryptErroredPayloads()
  }

  private async syncGroupFromScratch(groupUuid: string): Promise<void> {
    await this.sync.syncGroupsFromScratch([groupUuid])
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

  public async getInvitableContactsForGroup(groupUuid: string): Promise<TrustedContactInterface[]> {
    const users = await this.getGroupUsers(groupUuid)
    if (!users) {
      return []
    }

    const contacts = this.contacts.getAllContacts()
    return contacts.filter((contact) => {
      const isContactAlreadyInVault = users.some((user) => user.user_uuid === contact.contactUuid)
      return !isContactAlreadyInVault
    })
  }

  async inviteContactToGroup(
    group: GroupServerHash,
    contact: TrustedContactInterface,
    permissions: GroupPermission,
  ): Promise<GroupInviteServerHash | ClientDisplayableError> {
    const useCase = new AddContactToGroupUseCase(this.encryption, this.groupInvitesServer, this.items)
    const result = await useCase.execute({
      inviterPrivateKey: this.userDecryptedPrivateKey,
      inviterPublicKey: this.userPublicKey,
      group,
      contact,
      permissions,
    })

    void this.notifyCollaborationStatusChanged()

    await this.sync.sync()

    return result
  }

  public getInviteData(invite: GroupInviteServerHash): VaultKeyCopyContentSpecialized | undefined {
    return this.encryption.decryptVaultKeyContentWithPrivateKey(
      invite.encrypted_vault_key_content,
      invite.inviter_public_key,
      this.userDecryptedPrivateKey,
    )
  }

  async removeUserFromGroup(groupUuid: string, userUuid: string): Promise<ClientDisplayableError | void> {
    if (!this.isUserGroupAdmin(groupUuid)) {
      throw new Error('Only vault admins can remove users')
    }

    const useCase = new RemoveVaultMemberUseCase(this.groupUsersServer)
    const result = await useCase.execute({ groupUuid, userUuid })

    if (isClientDisplayableError(result)) {
      return result
    }

    void this.notifyCollaborationStatusChanged()

    await this.notifyEventSync(GroupServiceEvent.GroupMemberRemoved, { groupUuid })
  }

  async leaveGroup(groupUuid: string): Promise<ClientDisplayableError | void> {
    const useCase = new LeaveVaultUseCase(this.groupUsersServer, this.items)
    const result = await useCase.execute({ groupUuid, userUuid: this.user.uuid })

    if (isClientDisplayableError(result)) {
      return result
    }

    void this.notifyCollaborationStatusChanged()
  }

  async getGroupUsers(groupUuid: string): Promise<GroupUserServerHash[] | undefined> {
    const useCase = new GetGroupUsersUseCase(this.groupUsersServer)
    return useCase.execute({ groupUuid })
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

  public updateInvitesAfterVaultKeyDataChange(params: {
    vaultSystemIdentifier: string
    groupUuid: string
  }): Promise<ClientDisplayableError[]> {
    const useCase = new UpdateInvitesAfterGroupDataChangeUseCase(
      this.encryption,
      this.groupInvitesServer,
      this.groupUsersServer,
      this.contacts,
      this.items,
    )

    return useCase.execute({
      vaultSystemIdentifier: params.vaultSystemIdentifier,
      groupUuid: params.groupUuid,
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
