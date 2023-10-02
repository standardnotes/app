import { DiscardItemsLocally } from './../UseCase/DiscardItemsLocally'
import { UserKeyPairChangedEventData } from './../Session/UserKeyPairChangedEventData'
import { ClientDisplayableError } from '@standardnotes/responses'
import {
  DecryptedItemInterface,
  PayloadEmitSource,
  TrustedContactInterface,
  SharedVaultListingInterface,
  VaultListingInterface,
  KeySystemRootKeyStorageMode,
  EmojiString,
  IconType,
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
import { NotificationServiceEvent, NotificationServiceEventPayload } from '../UserEvent/NotificationServiceEvent'
import { DeleteThirdPartyVault } from './UseCase/DeleteExternalSharedVault'
import { DeleteSharedVault } from './UseCase/DeleteSharedVault'
import { ShareContactWithVault } from './UseCase/ShareContactWithVault'
import { CreateSharedVault } from './UseCase/CreateSharedVault'
import { ConvertToSharedVault } from './UseCase/ConvertToSharedVault'
import { GetVault } from '../Vault/UseCase/GetVault'
import { ContentType, NotificationType, Uuid } from '@standardnotes/domain-core'
import { HandleKeyPairChange } from '../Contacts/UseCase/HandleKeyPairChange'
import { FindContact } from '../Contacts/UseCase/FindContact'
import { GetOwnedSharedVaults } from './UseCase/GetOwnedSharedVaults'
import { SyncLocalVaultsWithRemoteSharedVaults } from './UseCase/SyncLocalVaultsWithRemoteSharedVaults'
import { VaultUserServiceInterface } from '../VaultUser/VaultUserServiceInterface'

export class SharedVaultService
  extends AbstractService<SharedVaultServiceEvent, SharedVaultServiceEventPayload>
  implements SharedVaultServiceInterface, InternalEventHandlerInterface
{
  constructor(
    private items: ItemManagerInterface,
    private session: SessionsClientInterface,
    private vaultUsers: VaultUserServiceInterface,
    private _syncLocalVaultsWithRemoteSharedVaults: SyncLocalVaultsWithRemoteSharedVaults,
    private _getVault: GetVault,
    private _getOwnedSharedVaults: GetOwnedSharedVaults,
    private _createSharedVault: CreateSharedVault,
    private _handleKeyPairChange: HandleKeyPairChange,
    private _findContact: FindContact,
    private _deleteThirdPartyVault: DeleteThirdPartyVault,
    private _shareContactWithVault: ShareContactWithVault,
    private _convertToSharedVault: ConvertToSharedVault,
    private _deleteSharedVault: DeleteSharedVault,
    private _discardItemsLocally: DiscardItemsLocally,
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
  }

  override deinit(): void {
    super.deinit()
    ;(this.items as unknown) = undefined
    ;(this.session as unknown) = undefined
    ;(this._syncLocalVaultsWithRemoteSharedVaults as unknown) = undefined
    ;(this._getVault as unknown) = undefined
    ;(this._createSharedVault as unknown) = undefined
    ;(this._handleKeyPairChange as unknown) = undefined
    ;(this._findContact as unknown) = undefined
    ;(this._deleteThirdPartyVault as unknown) = undefined
    ;(this._shareContactWithVault as unknown) = undefined
    ;(this._convertToSharedVault as unknown) = undefined
    ;(this._deleteSharedVault as unknown) = undefined
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
      case NotificationServiceEvent.NotificationReceived:
        await this.handleNotification(event.payload as NotificationServiceEventPayload)
        break
      case SyncEvent.ReceivedRemoteSharedVaults:
        void this.notifyEvent(SharedVaultServiceEvent.SharedVaultStatusChanged)
        break
    }
  }

  private async handleNotification(event: NotificationServiceEventPayload): Promise<void> {
    switch (event.eventPayload.props.type.value) {
      case NotificationType.TYPES.SelfRemovedFromSharedVault: {
        const vault = this._getVault.execute<SharedVaultListingInterface>({
          sharedVaultUuid: event.eventPayload.props.primaryIdentifier.value,
        })
        if (!vault.isFailed()) {
          await this._deleteThirdPartyVault.execute(vault.getValue())
        }
        break
      }
      case NotificationType.TYPES.UserRemovedFromSharedVault: {
        const vaultOrError = this._getVault.execute<SharedVaultListingInterface>({
          sharedVaultUuid: event.eventPayload.props.primaryIdentifier.value,
        })
        if (!vaultOrError.isFailed()) {
          const vault = vaultOrError.getValue()

          this.vaultUsers
            .invalidateVaultUsersCache(event.eventPayload.props.primaryIdentifier.value)
            .catch(console.error)

          await this._syncLocalVaultsWithRemoteSharedVaults.execute([vault])
          void this.notifyEvent(SharedVaultServiceEvent.SharedVaultStatusChanged)
        }
        break
      }
      case NotificationType.TYPES.SharedVaultItemRemoved: {
        const item = this.items.findItem((event.eventPayload.props.secondaryIdentifier as Uuid).value)
        if (item) {
          void this._discardItemsLocally.execute([item])
        }
        break
      }
      case NotificationType.TYPES.SharedVaultFileRemoved:
      case NotificationType.TYPES.SharedVaultFileUploaded:
      case NotificationType.TYPES.UserDesignatedAsSurvivor: {
        const vaultOrError = this._getVault.execute<SharedVaultListingInterface>({
          sharedVaultUuid: event.eventPayload.props.primaryIdentifier.value,
        })
        if (!vaultOrError.isFailed()) {
          await this._syncLocalVaultsWithRemoteSharedVaults.execute([vaultOrError.getValue()])

          void this.notifyEvent(SharedVaultServiceEvent.SharedVaultStatusChanged)
        }

        break
      }
    }
  }

  async createSharedVault(dto: {
    name: string
    description?: string
    iconString: IconType | EmojiString
    userInputtedPassword: string | undefined
    storagePreference?: KeySystemRootKeyStorageMode
  }): Promise<VaultListingInterface | ClientDisplayableError> {
    return this._createSharedVault.execute({
      vaultName: dto.name,
      vaultDescription: dto.description,
      vaultIcon: dto.iconString,
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

  public async deleteSharedVault(sharedVault: SharedVaultListingInterface): Promise<ClientDisplayableError | void> {
    return this._deleteSharedVault.execute({ sharedVault })
  }

  async shareContactWithVaults(contact: TrustedContactInterface): Promise<void> {
    if (contact.isMe) {
      throw new Error('Cannot share self contact')
    }

    const ownedVaults = this._getOwnedSharedVaults.execute().getValue()

    for (const vault of ownedVaults) {
      await this._shareContactWithVault.execute({
        sharedVault: vault,
        contactToShare: contact,
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
