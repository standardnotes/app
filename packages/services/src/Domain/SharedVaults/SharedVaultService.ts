import { UserKeyPairChangedEventData } from './../Session/UserKeyPairChangedEventData'
import { InviteToVault } from './UseCase/InviteToVault'
import {
  ClientDisplayableError,
  SharedVaultInviteServerHash,
  isErrorResponse,
  SharedVaultUserServerHash,
  isClientDisplayableError,
  SharedVaultPermission,
  UserEventType,
} from '@standardnotes/responses'
import { SharedVaultInvitesServer } from '@standardnotes/api'
import {
  DecryptedItemInterface,
  PayloadEmitSource,
  TrustedContactInterface,
  SharedVaultListingInterface,
  VaultListingInterface,
  AsymmetricMessageSharedVaultInvite,
  KeySystemRootKeyStorageMode,
} from '@standardnotes/models'
import { SharedVaultServiceInterface } from './SharedVaultServiceInterface'
import { SharedVaultServiceEvent, SharedVaultServiceEventPayload } from './SharedVaultServiceEvent'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { GetSharedVaultUsers } from './UseCase/GetSharedVaultUsers'
import { RemoveVaultMember } from './UseCase/RemoveSharedVaultMember'
import { AbstractService } from '../Service/AbstractService'
import { InternalEventHandlerInterface } from '../Internal/InternalEventHandlerInterface'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { SessionsClientInterface } from '../Session/SessionsClientInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { SyncEvent, SyncEventReceivedSharedVaultInvitesData } from '../Event/SyncEvent'
import { SessionEvent } from '../Session/SessionEvent'
import { InternalEventInterface } from '../Internal/InternalEventInterface'
import { LeaveVault } from './UseCase/LeaveSharedVault'
import { VaultServiceInterface } from '../Vaults/VaultServiceInterface'
import { UserEventServiceEvent, UserEventServiceEventPayload } from '../UserEvent/UserEventServiceEvent'
import { DeleteThirdPartyVault } from './UseCase/DeleteExternalSharedVault'
import { DeleteSharedVault } from './UseCase/DeleteSharedVault'
import { VaultServiceEvent, VaultServiceEventPayload } from '../Vaults/VaultServiceEvent'
import { AcceptVaultInvite } from './UseCase/AcceptVaultInvite'
import { GetTrustedPayload } from '../AsymmetricMessage/UseCase/GetTrustedPayload'
import { PendingSharedVaultInviteRecord } from './PendingSharedVaultInviteRecord'
import { GetUntrustedPayload } from '../AsymmetricMessage/UseCase/GetUntrustedPayload'
import { ShareContactWithVault } from './UseCase/ShareContactWithVault'
import { GetVaultContacts } from './UseCase/GetVaultContacts'
import { NotifyVaultUsersOfKeyRotation } from './UseCase/NotifyVaultUsersOfKeyRotation'
import { CreateSharedVault } from './UseCase/CreateSharedVault'
import { SendVaultDataChangedMessage } from './UseCase/SendVaultDataChangedMessage'
import { ConvertToSharedVault } from './UseCase/ConvertToSharedVault'
import { GetVault } from '../Vaults/UseCase/GetVault'
import { ContentType, Result } from '@standardnotes/domain-core'
import { HandleKeyPairChange } from '../Contacts/UseCase/HandleKeyPairChange'
import { FindContact } from '../Contacts/UseCase/FindContact'
import { GetAllContacts } from '../Contacts/UseCase/GetAllContacts'

export class SharedVaultService
  extends AbstractService<SharedVaultServiceEvent, SharedVaultServiceEventPayload>
  implements SharedVaultServiceInterface, InternalEventHandlerInterface
{
  private pendingInvites: Record<string, PendingSharedVaultInviteRecord> = {}

  constructor(
    private sync: SyncServiceInterface,
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
    private session: SessionsClientInterface,
    private vaults: VaultServiceInterface,
    private invitesServer: SharedVaultInvitesServer,
    private getVault: GetVault,
    private createSharedVaultUseCase: CreateSharedVault,
    private handleKeyPairChange: HandleKeyPairChange,
    private notifyVaultUsersOfKeyRotation: NotifyVaultUsersOfKeyRotation,
    private sendVaultDataChangeMessage: SendVaultDataChangedMessage,
    private getTrustedPayload: GetTrustedPayload,
    private getUntrustedPayload: GetUntrustedPayload,
    private findContact: FindContact,
    private getAllContacts: GetAllContacts,
    private getVaultContacts: GetVaultContacts,
    private acceptVaultInvite: AcceptVaultInvite,
    private inviteToVault: InviteToVault,
    private leaveVault: LeaveVault,
    private deleteThirdPartyVault: DeleteThirdPartyVault,
    private shareContactWithVault: ShareContactWithVault,
    private convertToSharedVault: ConvertToSharedVault,
    private deleteSharedVaultUseCase: DeleteSharedVault,
    private removeVaultMember: RemoveVaultMember,
    private getSharedVaultUsersUseCase: GetSharedVaultUsers,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    eventBus.addEventHandler(this, SessionEvent.UserKeyPairChanged)
    eventBus.addEventHandler(this, UserEventServiceEvent.UserEventReceived)
    eventBus.addEventHandler(this, VaultServiceEvent.VaultRootKeyRotated)

    this.eventDisposers.push(
      items.addObserver<TrustedContactInterface>(
        ContentType.TYPES.TrustedContact,
        async ({ changed, inserted, source }) => {
          await this.reprocessCachedInvitesTrustStatusAfterTrustedContactsChange()

          if (source === PayloadEmitSource.LocalChanged && inserted.length > 0) {
            void this.handleCreationOfNewTrustedContacts(inserted)
          }
          if (source === PayloadEmitSource.LocalChanged && changed.length > 0) {
            void this.handleTrustedContactsChange(changed)
          }
        },
      ),
    )

    this.eventDisposers.push(
      items.addObserver<VaultListingInterface>(ContentType.TYPES.VaultListing, ({ changed, source }) => {
        if (source === PayloadEmitSource.LocalChanged && changed.length > 0) {
          void this.handleVaultListingsChange(changed)
        }
      }),
    )
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === SessionEvent.UserKeyPairChanged) {
      void this.invitesServer.deleteAllInboundInvites()

      const eventData = event.payload as UserKeyPairChangedEventData

      void this.handleKeyPairChange.execute({
        newKeys: eventData.current,
        previousKeys: eventData.previous,
      })
    } else if (event.type === UserEventServiceEvent.UserEventReceived) {
      await this.handleUserEvent(event.payload as UserEventServiceEventPayload)
    } else if (event.type === VaultServiceEvent.VaultRootKeyRotated) {
      const payload = event.payload as VaultServiceEventPayload[VaultServiceEvent.VaultRootKeyRotated]
      await this.handleVaultRootKeyRotatedEvent(payload.vault)
    } else if (event.type === SyncEvent.ReceivedSharedVaultInvites) {
      await this.processInboundInvites(event.payload as SyncEventReceivedSharedVaultInvitesData)
    } else if (event.type === SyncEvent.ReceivedRemoteSharedVaults) {
      void this.notifyCollaborationStatusChanged()
    }
  }

  private async handleUserEvent(event: UserEventServiceEventPayload): Promise<void> {
    if (event.eventPayload.eventType === UserEventType.RemovedFromSharedVault) {
      const vault = this.getVault.execute<SharedVaultListingInterface>({
        sharedVaultUuid: event.eventPayload.sharedVaultUuid,
      })
      if (!vault.isFailed()) {
        await this.deleteThirdPartyVault.execute(vault.getValue())
      }
    } else if (event.eventPayload.eventType === UserEventType.SharedVaultItemRemoved) {
      const item = this.items.findItem(event.eventPayload.itemUuid)
      if (item) {
        this.items.removeItemsLocally([item])
      }
    }
  }

  private async handleVaultRootKeyRotatedEvent(vault: VaultListingInterface): Promise<void> {
    if (!vault.isSharedVaultListing()) {
      return
    }

    if (!this.isCurrentUserSharedVaultOwner(vault)) {
      return
    }

    await this.notifyVaultUsersOfKeyRotation.execute({
      sharedVault: vault,
      userUuid: this.session.getSureUser().uuid,
      keys: {
        encryption: this.encryption.getKeyPair(),
        signing: this.encryption.getSigningKeyPair(),
      },
    })
  }

  async createSharedVault(dto: {
    name: string
    description?: string
    userInputtedPassword: string | undefined
    storagePreference?: KeySystemRootKeyStorageMode
  }): Promise<VaultListingInterface | ClientDisplayableError> {
    return this.createSharedVaultUseCase.execute({
      vaultName: dto.name,
      vaultDescription: dto.description,
      userInputtedPassword: dto.userInputtedPassword,
      storagePreference: dto.storagePreference ?? KeySystemRootKeyStorageMode.Synced,
    })
  }

  async convertVaultToSharedVault(
    vault: VaultListingInterface,
  ): Promise<SharedVaultListingInterface | ClientDisplayableError> {
    return this.convertToSharedVault.execute({ vault })
  }

  public getCachedPendingInviteRecords(): PendingSharedVaultInviteRecord[] {
    return Object.values(this.pendingInvites)
  }

  private getAllSharedVaults(): SharedVaultListingInterface[] {
    const vaults = this.vaults.getVaults().filter((vault) => vault.isSharedVaultListing())
    return vaults as SharedVaultListingInterface[]
  }

  private findSharedVault(sharedVaultUuid: string): SharedVaultListingInterface | undefined {
    const result = this.getVault.execute<SharedVaultListingInterface>({ sharedVaultUuid })
    if (result.isFailed()) {
      return undefined
    }

    return result.getValue()
  }

  public isCurrentUserSharedVaultAdmin(sharedVault: SharedVaultListingInterface): boolean {
    if (!sharedVault.sharing.ownerUserUuid) {
      throw new Error(`Shared vault ${sharedVault.sharing.sharedVaultUuid} does not have an owner user uuid`)
    }
    return sharedVault.sharing.ownerUserUuid === this.session.userUuid
  }

  public isCurrentUserSharedVaultOwner(sharedVault: SharedVaultListingInterface): boolean {
    if (!sharedVault.sharing.ownerUserUuid) {
      throw new Error(`Shared vault ${sharedVault.sharing.sharedVaultUuid} does not have an owner user uuid`)
    }
    return sharedVault.sharing.ownerUserUuid === this.session.userUuid
  }

  public isSharedVaultUserSharedVaultOwner(user: SharedVaultUserServerHash): boolean {
    const vault = this.findSharedVault(user.shared_vault_uuid)
    return vault != undefined && vault.sharing.ownerUserUuid === user.user_uuid
  }

  private async handleCreationOfNewTrustedContacts(_contacts: TrustedContactInterface[]): Promise<void> {
    await this.downloadInboundInvites()
  }

  private async handleTrustedContactsChange(contacts: TrustedContactInterface[]): Promise<void> {
    for (const contact of contacts) {
      if (contact.isMe) {
        continue
      }

      await this.shareContactWithUserAdministeredSharedVaults(contact)
    }
  }

  private async handleVaultListingsChange(vaults: VaultListingInterface[]): Promise<void> {
    for (const vault of vaults) {
      if (!vault.isSharedVaultListing()) {
        continue
      }

      await this.sendVaultDataChangeMessage.execute({
        vault,
        senderUuid: this.session.getSureUser().uuid,
        keys: {
          encryption: this.encryption.getKeyPair(),
          signing: this.encryption.getSigningKeyPair(),
        },
      })
    }
  }

  public async downloadInboundInvites(): Promise<ClientDisplayableError | SharedVaultInviteServerHash[]> {
    const response = await this.invitesServer.getInboundUserInvites()

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to get inbound user invites ${response}`)
    }

    this.pendingInvites = {}

    await this.processInboundInvites(response.data.invites)

    return response.data.invites
  }

  public async getOutboundInvites(
    sharedVault?: SharedVaultListingInterface,
  ): Promise<SharedVaultInviteServerHash[] | ClientDisplayableError> {
    const response = await this.invitesServer.getOutboundUserInvites()

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to get outbound user invites ${response}`)
    }

    if (sharedVault) {
      return response.data.invites.filter((invite) => invite.shared_vault_uuid === sharedVault.sharing.sharedVaultUuid)
    }

    return response.data.invites
  }

  public async deleteInvite(invite: SharedVaultInviteServerHash): Promise<ClientDisplayableError | void> {
    const response = await this.invitesServer.deleteInvite({
      sharedVaultUuid: invite.shared_vault_uuid,
      inviteUuid: invite.uuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to delete invite ${response}`)
    }

    delete this.pendingInvites[invite.uuid]
  }

  public async deleteSharedVault(sharedVault: SharedVaultListingInterface): Promise<ClientDisplayableError | void> {
    return this.deleteSharedVaultUseCase.execute({ sharedVault })
  }

  private async reprocessCachedInvitesTrustStatusAfterTrustedContactsChange(): Promise<void> {
    const cachedInvites = this.getCachedPendingInviteRecords().map((record) => record.invite)

    await this.processInboundInvites(cachedInvites)
  }

  private async processInboundInvites(invites: SharedVaultInviteServerHash[]): Promise<void> {
    if (invites.length === 0) {
      return
    }

    for (const invite of invites) {
      const sender = this.findContact.execute({ userUuid: invite.sender_uuid })
      if (!sender.isFailed()) {
        const trustedMessage = this.getTrustedPayload.execute<AsymmetricMessageSharedVaultInvite>({
          message: invite,
          privateKey: this.encryption.getKeyPair().privateKey,
          sender: sender.getValue(),
        })

        if (!trustedMessage.isFailed()) {
          this.pendingInvites[invite.uuid] = {
            invite,
            message: trustedMessage.getValue(),
            trusted: true,
          }

          continue
        }
      }

      const untrustedMessage = this.getUntrustedPayload.execute<AsymmetricMessageSharedVaultInvite>({
        message: invite,
        privateKey: this.encryption.getKeyPair().privateKey,
      })

      if (!untrustedMessage.isFailed()) {
        this.pendingInvites[invite.uuid] = {
          invite,
          message: untrustedMessage.getValue(),
          trusted: false,
        }
      }
    }

    await this.notifyCollaborationStatusChanged()
  }

  private async notifyCollaborationStatusChanged(): Promise<void> {
    await this.notifyEventSync(SharedVaultServiceEvent.SharedVaultStatusChanged)
  }

  async acceptPendingSharedVaultInvite(pendingInvite: PendingSharedVaultInviteRecord): Promise<void> {
    if (!pendingInvite.trusted) {
      throw new Error('Cannot accept untrusted invite')
    }

    await this.acceptVaultInvite.execute({ invite: pendingInvite.invite, message: pendingInvite.message })

    delete this.pendingInvites[pendingInvite.invite.uuid]

    void this.sync.sync()

    await this.decryptErroredItemsAfterInviteAccept()

    await this.sync.syncSharedVaultsFromScratch([pendingInvite.invite.shared_vault_uuid])
  }

  private async decryptErroredItemsAfterInviteAccept(): Promise<void> {
    await this.encryption.decryptErroredPayloads()
  }

  public async getInvitableContactsForSharedVault(
    sharedVault: SharedVaultListingInterface,
  ): Promise<TrustedContactInterface[]> {
    const users = await this.getSharedVaultUsers(sharedVault)
    if (!users) {
      return []
    }

    const contacts = this.getAllContacts.execute()
    if (contacts.isFailed()) {
      return []
    }
    return contacts.getValue().filter((contact) => {
      const isContactAlreadyInVault = users.some((user) => user.user_uuid === contact.contactUuid)
      return !isContactAlreadyInVault
    })
  }

  private async getSharedVaultContacts(sharedVault: SharedVaultListingInterface): Promise<TrustedContactInterface[]> {
    const contacts = await this.getVaultContacts.execute(sharedVault.sharing.sharedVaultUuid)
    if (contacts.isFailed()) {
      return []
    }

    return contacts.getValue()
  }

  async inviteContactToSharedVault(
    sharedVault: SharedVaultListingInterface,
    contact: TrustedContactInterface,
    permissions: SharedVaultPermission,
  ): Promise<Result<SharedVaultInviteServerHash>> {
    const sharedVaultContacts = await this.getSharedVaultContacts(sharedVault)

    const result = await this.inviteToVault.execute({
      keys: {
        encryption: this.encryption.getKeyPair(),
        signing: this.encryption.getSigningKeyPair(),
      },
      sharedVault,
      recipient: contact,
      sharedVaultContacts,
      permissions,
    })

    void this.notifyCollaborationStatusChanged()

    await this.sync.sync()

    return result
  }

  async removeUserFromSharedVault(
    sharedVault: SharedVaultListingInterface,
    userUuid: string,
  ): Promise<ClientDisplayableError | void> {
    if (!this.isCurrentUserSharedVaultAdmin(sharedVault)) {
      throw new Error('Only vault admins can remove users')
    }

    if (this.vaults.isVaultLocked(sharedVault)) {
      throw new Error('Cannot remove user from locked vault')
    }

    const result = await this.removeVaultMember.execute({
      sharedVaultUuid: sharedVault.sharing.sharedVaultUuid,
      userUuid,
    })
    if (isClientDisplayableError(result)) {
      return result
    }

    void this.notifyCollaborationStatusChanged()

    await this.vaults.rotateVaultRootKey(sharedVault)
  }

  async leaveSharedVault(sharedVault: SharedVaultListingInterface): Promise<ClientDisplayableError | void> {
    const result = await this.leaveVault.execute({
      sharedVault: sharedVault,
      userUuid: this.session.getSureUser().uuid,
    })

    if (isClientDisplayableError(result)) {
      return result
    }

    void this.notifyCollaborationStatusChanged()
  }

  async getSharedVaultUsers(
    sharedVault: SharedVaultListingInterface,
  ): Promise<SharedVaultUserServerHash[] | undefined> {
    return this.getSharedVaultUsersUseCase.execute({ sharedVaultUuid: sharedVault.sharing.sharedVaultUuid })
  }

  async shareContactWithUserAdministeredSharedVaults(contact: TrustedContactInterface): Promise<void> {
    if (contact.isMe) {
      throw new Error('Cannot share self contact')
    }

    const sharedVaults = this.getAllSharedVaults()

    for (const vault of sharedVaults) {
      if (!this.isCurrentUserSharedVaultAdmin(vault)) {
        continue
      }

      await this.shareContactWithVault.execute({
        keys: {
          encryption: this.encryption.getKeyPair(),
          signing: this.encryption.getSigningKeyPair(),
        },
        sharedVault: vault,
        contactToShare: contact,
        senderUserUuid: this.session.getSureUser().uuid,
      })
    }
  }

  getItemLastEditedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined {
    if (!item.last_edited_by_uuid) {
      return undefined
    }

    const contact = this.findContact.execute({ userUuid: item.last_edited_by_uuid })

    return contact.isFailed() ? undefined : contact.getValue()
  }

  getItemSharedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined {
    if (!item.user_uuid || item.user_uuid === this.session.getSureUser().uuid) {
      return undefined
    }

    const contact = this.findContact.execute({ userUuid: item.user_uuid })

    return contact.isFailed() ? undefined : contact.getValue()
  }

  override deinit(): void {
    super.deinit()
    ;(this.sync as unknown) = undefined
    ;(this.items as unknown) = undefined
    ;(this.encryption as unknown) = undefined
    ;(this.session as unknown) = undefined
    ;(this.vaults as unknown) = undefined
    ;(this.invitesServer as unknown) = undefined
    ;(this.getVault as unknown) = undefined
    ;(this.createSharedVaultUseCase as unknown) = undefined
    ;(this.handleKeyPairChange as unknown) = undefined
    ;(this.notifyVaultUsersOfKeyRotation as unknown) = undefined
    ;(this.sendVaultDataChangeMessage as unknown) = undefined
    ;(this.getTrustedPayload as unknown) = undefined
    ;(this.getUntrustedPayload as unknown) = undefined
    ;(this.findContact as unknown) = undefined
    ;(this.getAllContacts as unknown) = undefined
    ;(this.getVaultContacts as unknown) = undefined
    ;(this.acceptVaultInvite as unknown) = undefined
    ;(this.inviteToVault as unknown) = undefined
    ;(this.leaveVault as unknown) = undefined
    ;(this.deleteThirdPartyVault as unknown) = undefined
    ;(this.shareContactWithVault as unknown) = undefined
    ;(this.convertToSharedVault as unknown) = undefined
    ;(this.deleteSharedVaultUseCase as unknown) = undefined
    ;(this.removeVaultMember as unknown) = undefined
    ;(this.getSharedVaultUsersUseCase as unknown) = undefined
  }
}
