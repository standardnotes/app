import { UserKeyPairChangedEventData } from './../Session/UserKeyPairChangedEventData'
import { ClientDisplayableError, UserEventType } from '@standardnotes/responses'
import {
  DecryptedItemInterface,
  PayloadEmitSource,
  TrustedContactInterface,
  SharedVaultListingInterface,
  VaultListingInterface,
  KeySystemRootKeyStorageMode,
} from '@standardnotes/models'
import { SharedVaultServiceInterface } from './SharedVaultServiceInterface'
import { SharedVaultServiceEvent, SharedVaultServiceEventPayload } from './SharedVaultServiceEvent'
import { AbstractService } from '../Service/AbstractService'
import { InternalEventHandlerInterface } from '../Internal/InternalEventHandlerInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { SessionsClientInterface } from '../Session/SessionsClientInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { SyncEvent } from '../Event/SyncEvent'
import { SessionEvent } from '../Session/SessionEvent'
import { InternalEventInterface } from '../Internal/InternalEventInterface'
import { UserEventServiceEvent, UserEventServiceEventPayload } from '../UserEvent/UserEventServiceEvent'
import { DeleteThirdPartyVault } from './UseCase/DeleteExternalSharedVault'
import { DeleteSharedVault } from './UseCase/DeleteSharedVault'
import { VaultServiceEvent, VaultServiceEventPayload } from '../Vaults/VaultServiceEvent'
import { ShareContactWithVault } from './UseCase/ShareContactWithVault'
import { NotifyVaultUsersOfKeyRotation } from './UseCase/NotifyVaultUsersOfKeyRotation'
import { CreateSharedVault } from './UseCase/CreateSharedVault'
import { SendVaultDataChangedMessage } from './UseCase/SendVaultDataChangedMessage'
import { ConvertToSharedVault } from './UseCase/ConvertToSharedVault'
import { GetVault } from '../Vaults/UseCase/GetVault'
import { ContentType } from '@standardnotes/domain-core'
import { HandleKeyPairChange } from '../Contacts/UseCase/HandleKeyPairChange'
import { FindContact } from '../Contacts/UseCase/FindContact'
import { EncryptionProviderInterface } from '../Encryption/EncryptionProviderInterface'
import { IsVaultOwner } from '../VaultUser/UseCase/IsVaultOwner'
import { GetOwnedSharedVaults } from './UseCase/GetOwnedSharedVaults'

export class SharedVaultService
  extends AbstractService<SharedVaultServiceEvent, SharedVaultServiceEventPayload>
  implements SharedVaultServiceInterface, InternalEventHandlerInterface
{
  constructor(
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
    private session: SessionsClientInterface,
    private _getVault: GetVault,
    private _getOwnedSharedVaults: GetOwnedSharedVaults,
    private _createSharedVault: CreateSharedVault,
    private _handleKeyPairChange: HandleKeyPairChange,
    private _notifyVaultUsersOfKeyRotation: NotifyVaultUsersOfKeyRotation,
    private _sendVaultDataChangeMessage: SendVaultDataChangedMessage,
    private _findContact: FindContact,
    private _deleteThirdPartyVault: DeleteThirdPartyVault,
    private _shareContactWithVault: ShareContactWithVault,
    private _convertToSharedVault: ConvertToSharedVault,
    private _deleteSharedVault: DeleteSharedVault,
    private _isVaultAdmin: IsVaultOwner,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    this.eventDisposers.push(
      items.addObserver<TrustedContactInterface>(ContentType.TYPES.TrustedContact, async ({ changed, source }) => {
        if (source === PayloadEmitSource.LocalChanged && changed.length > 0) {
          void this.handleTrustedContactsChange(changed)
        }
      }),
    )

    this.eventDisposers.push(
      items.addObserver<VaultListingInterface>(ContentType.TYPES.VaultListing, ({ changed, source }) => {
        if (source === PayloadEmitSource.LocalChanged && changed.length > 0) {
          void this.handleVaultListingsChange(changed)
        }
      }),
    )
  }

  override deinit(): void {
    super.deinit()
    ;(this.items as unknown) = undefined
    ;(this.encryption as unknown) = undefined
    ;(this.session as unknown) = undefined
    ;(this._getVault as unknown) = undefined
    ;(this._createSharedVault as unknown) = undefined
    ;(this._handleKeyPairChange as unknown) = undefined
    ;(this._notifyVaultUsersOfKeyRotation as unknown) = undefined
    ;(this._sendVaultDataChangeMessage as unknown) = undefined
    ;(this._findContact as unknown) = undefined
    ;(this._deleteThirdPartyVault as unknown) = undefined
    ;(this._shareContactWithVault as unknown) = undefined
    ;(this._convertToSharedVault as unknown) = undefined
    ;(this._deleteSharedVault as unknown) = undefined
    ;(this._isVaultAdmin as unknown) = undefined
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    switch (event.type) {
      case SessionEvent.UserKeyPairChanged: {
        const eventData = event.payload as UserKeyPairChangedEventData
        void this._handleKeyPairChange.execute({
          newKeys: eventData.current,
          previousKeys: eventData.previous,
        })
        break
      }
      case UserEventServiceEvent.UserEventReceived:
        await this.handleUserEvent(event.payload as UserEventServiceEventPayload)
        break
      case VaultServiceEvent.VaultRootKeyRotated: {
        const payload = event.payload as VaultServiceEventPayload[VaultServiceEvent.VaultRootKeyRotated]
        await this.handleVaultRootKeyRotatedEvent(payload.vault)
        break
      }
      case SyncEvent.ReceivedRemoteSharedVaults:
        void this.notifyEventSync(SharedVaultServiceEvent.SharedVaultStatusChanged)
        break
    }
  }

  private async handleUserEvent(event: UserEventServiceEventPayload): Promise<void> {
    switch (event.eventPayload.eventType) {
      case UserEventType.RemovedFromSharedVault: {
        const vault = this._getVault.execute<SharedVaultListingInterface>({
          sharedVaultUuid: event.eventPayload.sharedVaultUuid,
        })
        if (!vault.isFailed()) {
          await this._deleteThirdPartyVault.execute(vault.getValue())
        }
        break
      }
      case UserEventType.SharedVaultItemRemoved: {
        const item = this.items.findItem(event.eventPayload.itemUuid)
        if (item) {
          this.items.removeItemsLocally([item])
        }
        break
      }
    }
  }

  private isCurrentUserVaultOwner(sharedVault: SharedVaultListingInterface): boolean {
    if (!sharedVault.sharing.ownerUserUuid) {
      throw new Error(`Shared vault ${sharedVault.sharing.sharedVaultUuid} does not have an owner user uuid`)
    }

    return sharedVault.sharing.ownerUserUuid === this.session.userUuid
  }

  private async handleVaultRootKeyRotatedEvent(vault: VaultListingInterface): Promise<void> {
    if (!vault.isSharedVaultListing()) {
      return
    }

    if (!this.isCurrentUserVaultOwner(vault)) {
      return
    }

    await this._notifyVaultUsersOfKeyRotation.execute({
      sharedVault: vault,
      senderUuid: this.session.getSureUser().uuid,
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
    return this._createSharedVault.execute({
      vaultName: dto.name,
      vaultDescription: dto.description,
      userInputtedPassword: dto.userInputtedPassword,
      storagePreference: dto.storagePreference ?? KeySystemRootKeyStorageMode.Synced,
    })
  }

  async convertVaultToSharedVault(
    vault: VaultListingInterface,
  ): Promise<SharedVaultListingInterface | ClientDisplayableError> {
    return this._convertToSharedVault.execute({ vault })
  }

  private async handleTrustedContactsChange(contacts: TrustedContactInterface[]): Promise<void> {
    for (const contact of contacts) {
      if (contact.isMe) {
        continue
      }

      await this.shareContactWithVaults(contact)
    }
  }

  private async handleVaultListingsChange(vaults: VaultListingInterface[]): Promise<void> {
    for (const vault of vaults) {
      if (!vault.isSharedVaultListing()) {
        continue
      }

      await this._sendVaultDataChangeMessage.execute({
        vault,
        senderUuid: this.session.getSureUser().uuid,
        keys: {
          encryption: this.encryption.getKeyPair(),
          signing: this.encryption.getSigningKeyPair(),
        },
      })
    }
  }

  public async deleteSharedVault(sharedVault: SharedVaultListingInterface): Promise<ClientDisplayableError | void> {
    return this._deleteSharedVault.execute({ sharedVault })
  }

  async shareContactWithVaults(contact: TrustedContactInterface): Promise<void> {
    if (contact.isMe) {
      throw new Error('Cannot share self contact')
    }

    const ownedVaults = this._getOwnedSharedVaults.execute({ userUuid: this.session.userUuid }).getValue()

    for (const vault of ownedVaults) {
      await this._shareContactWithVault.execute({
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

    const contact = this._findContact.execute({ userUuid: item.last_edited_by_uuid })

    return contact.isFailed() ? undefined : contact.getValue()
  }

  getItemSharedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined {
    if (!item.user_uuid || item.user_uuid === this.session.getSureUser().uuid) {
      return undefined
    }

    const contact = this._findContact.execute({ userUuid: item.user_uuid })

    return contact.isFailed() ? undefined : contact.getValue()
  }
}
