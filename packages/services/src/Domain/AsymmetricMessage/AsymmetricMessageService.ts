import { MutatorClientInterface } from './../Mutator/MutatorClientInterface'
import { AsymmetricMessageServerHash, ClientDisplayableError, isClientDisplayableError } from '@standardnotes/responses'
import { SyncEvent, SyncEventReceivedAsymmetricMessagesData } from '../Event/SyncEvent'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { InternalEventHandlerInterface } from '../Internal/InternalEventHandlerInterface'
import { InternalEventInterface } from '../Internal/InternalEventInterface'
import { AbstractService } from '../Service/AbstractService'
import { GetTrustedPayload } from './UseCase/GetTrustedPayload'
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
  VaultListingInterface,
} from '@standardnotes/models'
import { HandleRootKeyChangedMessage } from './UseCase/HandleRootKeyChangedMessage'
import { SessionEvent } from '../Session/SessionEvent'
import { AsymmetricMessageServer } from '@standardnotes/api'
import { UserKeyPairChangedEventData } from '../Session/UserKeyPairChangedEventData'
import { SendOwnContactChangeMessage } from './UseCase/SendOwnContactChangeMessage'
import { GetOutboundMessages } from './UseCase/GetOutboundMessages'
import { GetInboundMessages } from './UseCase/GetInboundMessages'
import { GetVault } from '../Vaults/UseCase/GetVault'
import { AsymmetricMessageServiceInterface } from './AsymmetricMessageServiceInterface'
import { GetUntrustedPayload } from './UseCase/GetUntrustedPayload'
import { FindContact } from '../Contacts/UseCase/FindContact'
import { CreateOrEditContact } from '../Contacts/UseCase/CreateOrEditContact'
import { ReplaceContactData } from '../Contacts/UseCase/ReplaceContactData'
import { GetAllContacts } from '../Contacts/UseCase/GetAllContacts'

export class AsymmetricMessageService
  extends AbstractService
  implements AsymmetricMessageServiceInterface, InternalEventHandlerInterface
{
  constructor(
    private messageServer: AsymmetricMessageServer,
    private encryption: EncryptionProviderInterface,
    private mutator: MutatorClientInterface,
    private createOrEditContact: CreateOrEditContact,
    private findContact: FindContact,
    private getAllContacts: GetAllContacts,
    private replaceContactData: ReplaceContactData,
    private getTrustedPayload: GetTrustedPayload,
    private getVault: GetVault,
    private handleRootKeyChangedMessage: HandleRootKeyChangedMessage,
    private sendOwnContactChangedMessage: SendOwnContactChangeMessage,
    private getOutboundMessagesUseCase: GetOutboundMessages,
    private getInboundMessagesUseCase: GetInboundMessages,
    private getUntrustedPayload: GetUntrustedPayload,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

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
    return this.getOutboundMessagesUseCase.execute()
  }

  public async getInboundMessages(): Promise<AsymmetricMessageServerHash[] | ClientDisplayableError> {
    return this.getInboundMessagesUseCase.execute()
  }

  public async downloadAndProcessInboundMessages(): Promise<void> {
    const messages = await this.getInboundMessages()
    if (isClientDisplayableError(messages)) {
      return
    }

    await this.handleRemoteReceivedAsymmetricMessages(messages)
  }

  private async sendOwnContactChangeEventToAllContacts(data: UserKeyPairChangedEventData): Promise<void> {
    if (!data.previous) {
      return
    }

    const contacts = this.getAllContacts.execute()
    if (contacts.isFailed()) {
      return
    }

    for (const contact of contacts.getValue()) {
      if (contact.isMe) {
        continue
      }

      await this.sendOwnContactChangedMessage.execute({
        senderOldKeyPair: data.previous.encryption,
        senderOldSigningKeyPair: data.previous.signing,
        senderNewKeyPair: data.current.encryption,
        senderNewSigningKeyPair: data.current.signing,
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
    const result = this.getUntrustedPayload.execute({
      privateKey: this.encryption.getKeyPair().privateKey,
      message,
    })

    if (result.isFailed()) {
      return undefined
    }

    return result.getValue()
  }

  getTrustedMessagePayload(message: AsymmetricMessageServerHash): AsymmetricMessagePayload | undefined {
    const contact = this.findContact.execute({ userUuid: message.sender_uuid })
    if (contact.isFailed()) {
      return undefined
    }

    const result = this.getTrustedPayload.execute({
      privateKey: this.encryption.getKeyPair().privateKey,
      sender: contact.getValue(),
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
    const vault = this.getVault.execute<VaultListingInterface>({ sharedVaultUuid: trustedPayload.data.sharedVaultUuid })
    if (vault.isFailed()) {
      return
    }

    await this.mutator.changeItem<VaultListingMutator>(
      vault.getValue(),
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

    await this.replaceContactData.execute(trustedPayload.data.trustedContact)
  }

  async handleTrustedSenderKeypairChangedMessage(
    message: AsymmetricMessageServerHash,
    trustedPayload: AsymmetricMessageSenderKeypairChanged,
  ): Promise<void> {
    await this.createOrEditContact.execute({
      contactUuid: message.sender_uuid,
      publicKey: trustedPayload.data.newEncryptionPublicKey,
      signingPublicKey: trustedPayload.data.newSigningPublicKey,
    })
  }

  async handleTrustedSharedVaultRootKeyChangedMessage(
    _message: AsymmetricMessageServerHash,
    trustedPayload: AsymmetricMessageSharedVaultRootKeyChanged,
  ): Promise<void> {
    await this.handleRootKeyChangedMessage.execute(trustedPayload)
  }

  public override deinit(): void {
    super.deinit()
    ;(this.messageServer as unknown) = undefined
    ;(this.encryption as unknown) = undefined
    ;(this.mutator as unknown) = undefined
    ;(this.createOrEditContact as unknown) = undefined
    ;(this.findContact as unknown) = undefined
    ;(this.getAllContacts as unknown) = undefined
    ;(this.replaceContactData as unknown) = undefined
    ;(this.getTrustedPayload as unknown) = undefined
    ;(this.getVault as unknown) = undefined
    ;(this.handleRootKeyChangedMessage as unknown) = undefined
    ;(this.sendOwnContactChangedMessage as unknown) = undefined
    ;(this.getOutboundMessagesUseCase as unknown) = undefined
    ;(this.getInboundMessagesUseCase as unknown) = undefined
    ;(this.getUntrustedPayload as unknown) = undefined
  }
}
