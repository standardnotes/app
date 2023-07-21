import { MutatorClientInterface } from './../Mutator/MutatorClientInterface'
import { ContactServiceInterface } from './../Contacts/ContactServiceInterface'
import { AsymmetricMessageServerHash, ClientDisplayableError, isClientDisplayableError } from '@standardnotes/responses'
import { SyncEvent, SyncEventReceivedAsymmetricMessagesData } from '../Event/SyncEvent'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { InternalEventHandlerInterface } from '../Internal/InternalEventHandlerInterface'
import { InternalEventInterface } from '../Internal/InternalEventInterface'
import { AbstractService } from '../Service/AbstractService'
import { GetAsymmetricMessageTrustedPayload } from './UseCase/GetAsymmetricMessageTrustedPayload'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import {
  AsymmetricMessageSharedVaultRootKeyChanged,
  AsymmetricMessagePayloadType,
  AsymmetricMessageSenderKeypairChanged,
  AsymmetricMessageTrustedContactShare,
  AsymmetricMessagePayload,
  AsymmetricMessageSharedVaultMetadataChanged,
  VaultListingMutator,
  MutationType,
  PayloadEmitSource,
} from '@standardnotes/models'
import { HandleTrustedSharedVaultRootKeyChangedMessage } from './UseCase/HandleTrustedSharedVaultRootKeyChangedMessage'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { SessionEvent } from '../Session/SessionEvent'
import { AsymmetricMessageServer, HttpServiceInterface } from '@standardnotes/api'
import { UserKeyPairChangedEventData } from '../Session/UserKeyPairChangedEventData'
import { SendOwnContactChangeMessage } from './UseCase/SendOwnContactChangeMessage'
import { GetOutboundAsymmetricMessages } from './UseCase/GetOutboundAsymmetricMessages'
import { GetInboundAsymmetricMessages } from './UseCase/GetInboundAsymmetricMessages'
import { GetVaultUseCase } from '../Vaults/UseCase/GetVault'
import { AsymmetricMessageServiceInterface } from './AsymmetricMessageServiceInterface'
import { GetAsymmetricMessageUntrustedPayload } from './UseCase/GetAsymmetricMessageUntrustedPayload'

export class AsymmetricMessageService
  extends AbstractService
  implements AsymmetricMessageServiceInterface, InternalEventHandlerInterface
{
  private messageServer: AsymmetricMessageServer

  constructor(
    http: HttpServiceInterface,
    private encryption: EncryptionProviderInterface,
    private contacts: ContactServiceInterface,
    private items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private sync: SyncServiceInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    this.messageServer = new AsymmetricMessageServer(http)

    eventBus.addEventHandler(this, SyncEvent.ReceivedAsymmetricMessages)
    eventBus.addEventHandler(this, SessionEvent.UserKeyPairChanged)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === SessionEvent.UserKeyPairChanged) {
      void this.messageServer.deleteAllInboundMessages()
      void this.sendOwnContactChangeEventToAllContacts(event.payload as UserKeyPairChangedEventData)
    }

    if (event.type === SyncEvent.ReceivedAsymmetricMessages) {
      void this.handleRemoteReceivedAsymmetricMessages(event.payload as SyncEventReceivedAsymmetricMessagesData)
    }
  }

  public async getOutboundMessages(): Promise<AsymmetricMessageServerHash[] | ClientDisplayableError> {
    const usecase = new GetOutboundAsymmetricMessages(this.messageServer)
    return usecase.execute()
  }

  public async getInboundMessages(): Promise<AsymmetricMessageServerHash[] | ClientDisplayableError> {
    const usecase = new GetInboundAsymmetricMessages(this.messageServer)
    return usecase.execute()
  }

  public async downloadAndProcessInboundMessages(): Promise<void> {
    const messages = await this.getInboundMessages()
    if (isClientDisplayableError(messages)) {
      return
    }

    await this.handleRemoteReceivedAsymmetricMessages(messages)
  }

  private async sendOwnContactChangeEventToAllContacts(data: UserKeyPairChangedEventData): Promise<void> {
    if (!data.oldKeyPair || !data.oldSigningKeyPair) {
      return
    }

    const useCase = new SendOwnContactChangeMessage(this.encryption, this.messageServer)

    const contacts = this.contacts.getAllContacts()

    for (const contact of contacts) {
      if (contact.isMe) {
        continue
      }

      await useCase.execute({
        senderOldKeyPair: data.oldKeyPair,
        senderOldSigningKeyPair: data.oldSigningKeyPair,
        senderNewKeyPair: data.newKeyPair,
        senderNewSigningKeyPair: data.newSigningKeyPair,
        contact,
      })
    }
  }

  sortServerMessages(messages: AsymmetricMessageServerHash[]): AsymmetricMessageServerHash[] {
    const SortedPriorityTypes = [AsymmetricMessagePayloadType.SenderKeypairChanged]

    const priority: AsymmetricMessageServerHash[] = []
    const regular: AsymmetricMessageServerHash[] = []

    const allMessagesOldestFirst = messages.slice().sort((a, b) => a.created_at_timestamp - b.created_at_timestamp)

    const messageTypeMap: Record<string, AsymmetricMessagePayloadType> = {}

    for (const message of allMessagesOldestFirst) {
      const messageType = this.getServerMessageType(message)
      if (!messageType) {
        continue
      }

      messageTypeMap[message.uuid] = messageType

      if (SortedPriorityTypes.includes(messageType)) {
        priority.push(message)
      } else {
        regular.push(message)
      }
    }

    const sortedPriority = priority.sort((a, b) => {
      const typeA = messageTypeMap[a.uuid]
      const typeB = messageTypeMap[b.uuid]

      if (typeA !== typeB) {
        return SortedPriorityTypes.indexOf(typeA) - SortedPriorityTypes.indexOf(typeB)
      }

      return a.created_at_timestamp - b.created_at_timestamp
    })

    const regularMessagesOldestFirst = regular.sort((a, b) => a.created_at_timestamp - b.created_at_timestamp)

    return [...sortedPriority, ...regularMessagesOldestFirst]
  }

  getServerMessageType(message: AsymmetricMessageServerHash): AsymmetricMessagePayloadType | undefined {
    const result = this.getUntrustedMessagePayload(message)

    if (!result) {
      return undefined
    }

    return result.type
  }

  async handleRemoteReceivedAsymmetricMessages(messages: AsymmetricMessageServerHash[]): Promise<void> {
    if (messages.length === 0) {
      return
    }

    const sortedMessages = this.sortServerMessages(messages)

    for (const message of sortedMessages) {
      const trustedPayload = this.getTrustedMessagePayload(message)
      if (!trustedPayload) {
        continue
      }

      await this.handleTrustedMessageResult(message, trustedPayload)
    }
  }

  private async handleTrustedMessageResult(
    message: AsymmetricMessageServerHash,
    payload: AsymmetricMessagePayload,
  ): Promise<void> {
    if (payload.data.recipientUuid !== message.user_uuid) {
      return
    }

    if (payload.type === AsymmetricMessagePayloadType.ContactShare) {
      await this.handleTrustedContactShareMessage(message, payload)
    } else if (payload.type === AsymmetricMessagePayloadType.SenderKeypairChanged) {
      await this.handleTrustedSenderKeypairChangedMessage(message, payload)
    } else if (payload.type === AsymmetricMessagePayloadType.SharedVaultRootKeyChanged) {
      await this.handleTrustedSharedVaultRootKeyChangedMessage(message, payload)
    } else if (payload.type === AsymmetricMessagePayloadType.SharedVaultMetadataChanged) {
      await this.handleTrustedVaultMetadataChangedMessage(message, payload)
    } else if (payload.type === AsymmetricMessagePayloadType.SharedVaultInvite) {
      throw new Error('Shared vault invites payloads are not handled as part of asymmetric messages')
    }

    await this.deleteMessageAfterProcessing(message)
  }

  getUntrustedMessagePayload(message: AsymmetricMessageServerHash): AsymmetricMessagePayload | undefined {
    const useCase = new GetAsymmetricMessageUntrustedPayload(this.encryption.operators)

    const result = useCase.execute({
      privateKey: this.encryption.getKeyPair().privateKey,
      message,
    })

    if (result.isFailed()) {
      return undefined
    }

    return result.getValue()
  }

  getTrustedMessagePayload(message: AsymmetricMessageServerHash): AsymmetricMessagePayload | undefined {
    const useCase = new GetAsymmetricMessageTrustedPayload(this.encryption.operators, this.contacts)

    const result = useCase.execute({
      privateKey: this.encryption.getKeyPair().privateKey,
      message,
    })

    if (result.isFailed()) {
      return undefined
    }

    return result.getValue()
  }

  async deleteMessageAfterProcessing(message: AsymmetricMessageServerHash): Promise<void> {
    await this.messageServer.deleteMessage({ messageUuid: message.uuid })
  }

  async handleTrustedVaultMetadataChangedMessage(
    _message: AsymmetricMessageServerHash,
    trustedPayload: AsymmetricMessageSharedVaultMetadataChanged,
  ): Promise<void> {
    const vault = new GetVaultUseCase(this.items).execute({ sharedVaultUuid: trustedPayload.data.sharedVaultUuid })
    if (!vault) {
      return
    }

    await this.mutator.changeItem<VaultListingMutator>(
      vault,
      (mutator) => {
        mutator.name = trustedPayload.data.name
        mutator.description = trustedPayload.data.description
      },
      MutationType.UpdateUserTimestamps,
      PayloadEmitSource.RemoteRetrieved,
    )
  }

  async handleTrustedContactShareMessage(
    _message: AsymmetricMessageServerHash,
    trustedPayload: AsymmetricMessageTrustedContactShare,
  ): Promise<void> {
    if (trustedPayload.data.trustedContact.isMe) {
      return
    }

    await this.contacts.createOrUpdateTrustedContactFromContactShare(trustedPayload.data.trustedContact)
  }

  async handleTrustedSenderKeypairChangedMessage(
    message: AsymmetricMessageServerHash,
    trustedPayload: AsymmetricMessageSenderKeypairChanged,
  ): Promise<void> {
    await this.contacts.createOrEditTrustedContact({
      contactUuid: message.sender_uuid,
      publicKey: trustedPayload.data.newEncryptionPublicKey,
      signingPublicKey: trustedPayload.data.newSigningPublicKey,
    })
  }

  async handleTrustedSharedVaultRootKeyChangedMessage(
    _message: AsymmetricMessageServerHash,
    trustedPayload: AsymmetricMessageSharedVaultRootKeyChanged,
  ): Promise<void> {
    const useCase = new HandleTrustedSharedVaultRootKeyChangedMessage(
      this.mutator,
      this.items,
      this.sync,
      this.encryption,
    )
    await useCase.execute(trustedPayload)
  }
}
