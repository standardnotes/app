import { MessageSentToUserEvent } from '@standardnotes/domain-events'
import { AsymmetricMessageServerHash } from '@standardnotes/responses'
import { AsymmetricMessageServer } from '@standardnotes/api'
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
import { Result } from '@standardnotes/domain-core'

import { GetKeyPairs } from './../Encryption/UseCase/GetKeyPairs'
import { SyncServiceInterface } from './../Sync/SyncServiceInterface'
import { SessionsClientInterface } from './../Session/SessionsClientInterface'
import { MutatorClientInterface } from './../Mutator/MutatorClientInterface'
import { SyncEvent, SyncEventReceivedAsymmetricMessagesData } from '../Event/SyncEvent'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { InternalEventHandlerInterface } from '../Internal/InternalEventHandlerInterface'
import { InternalEventInterface } from '../Internal/InternalEventInterface'
import { AbstractService } from '../Service/AbstractService'
import { GetTrustedPayload } from './UseCase/GetTrustedPayload'
import { HandleRootKeyChangedMessage } from './UseCase/HandleRootKeyChangedMessage'
import { GetOutboundMessages } from './UseCase/GetOutboundMessages'
import { GetInboundMessages } from './UseCase/GetInboundMessages'
import { GetVault } from '../Vault/UseCase/GetVault'
import { AsymmetricMessageServiceInterface } from './AsymmetricMessageServiceInterface'
import { GetUntrustedPayload } from './UseCase/GetUntrustedPayload'
import { FindContact } from '../Contacts/UseCase/FindContact'
import { CreateOrEditContact } from '../Contacts/UseCase/CreateOrEditContact'
import { ReplaceContactData } from '../Contacts/UseCase/ReplaceContactData'
import { EncryptionProviderInterface } from '../Encryption/EncryptionProviderInterface'
import { WebSocketsServiceEvent } from '../Api/WebSocketsServiceEvent'

export class AsymmetricMessageService
  extends AbstractService
  implements AsymmetricMessageServiceInterface, InternalEventHandlerInterface
{
  private handledMessages = new Set<string>()

  constructor(
    private encryption: EncryptionProviderInterface,
    private mutator: MutatorClientInterface,
    private sessions: SessionsClientInterface,
    private sync: SyncServiceInterface,
    private messageServer: AsymmetricMessageServer,
    private _createOrEditContact: CreateOrEditContact,
    private _findContact: FindContact,
    private _replaceContactData: ReplaceContactData,
    private _getTrustedPayload: GetTrustedPayload,
    private _getVault: GetVault,
    private _handleRootKeyChangedMessage: HandleRootKeyChangedMessage,
    private _getOutboundMessagesUseCase: GetOutboundMessages,
    private _getInboundMessagesUseCase: GetInboundMessages,
    private _getUntrustedPayload: GetUntrustedPayload,
    private _getKeyPairs: GetKeyPairs,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)
  }

  public override deinit(): void {
    super.deinit()
    ;(this.messageServer as unknown) = undefined
    ;(this.encryption as unknown) = undefined
    ;(this.mutator as unknown) = undefined
    ;(this._createOrEditContact as unknown) = undefined
    ;(this._findContact as unknown) = undefined
    ;(this._replaceContactData as unknown) = undefined
    ;(this._getTrustedPayload as unknown) = undefined
    ;(this._getVault as unknown) = undefined
    ;(this._handleRootKeyChangedMessage as unknown) = undefined
    ;(this._getOutboundMessagesUseCase as unknown) = undefined
    ;(this._getInboundMessagesUseCase as unknown) = undefined
    ;(this._getUntrustedPayload as unknown) = undefined
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    switch (event.type) {
      case SyncEvent.ReceivedAsymmetricMessages:
        void this.handleRemoteReceivedAsymmetricMessages(event.payload as SyncEventReceivedAsymmetricMessagesData)
        break
      case WebSocketsServiceEvent.MessageSentToUser:
        void this.handleRemoteReceivedAsymmetricMessages([(event as MessageSentToUserEvent).payload.message])
        break
    }
  }

  public async getOutboundMessages(): Promise<Result<AsymmetricMessageServerHash[]>> {
    return this._getOutboundMessagesUseCase.execute()
  }

  public async getInboundMessages(): Promise<Result<AsymmetricMessageServerHash[]>> {
    return this._getInboundMessagesUseCase.execute()
  }

  public async downloadAndProcessInboundMessages(): Promise<void> {
    const messages = await this.getInboundMessages()
    if (messages.isFailed()) {
      return
    }

    await this.handleRemoteReceivedAsymmetricMessages(messages.getValue())
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

    if (result.isFailed()) {
      return undefined
    }

    return result.getValue().type
  }

  async handleRemoteReceivedAsymmetricMessages(messages: AsymmetricMessageServerHash[]): Promise<void> {
    if (messages.length === 0) {
      return
    }

    const sortedMessages = this.sortServerMessages(messages)

    for (const message of sortedMessages) {
      const trustedPayload = this.getTrustedMessagePayload(message)
      if (trustedPayload.isFailed()) {
        continue
      }

      await this.handleTrustedMessageResult(message, trustedPayload.getValue())
    }

    void this.sync.sync()
  }

  async handleTrustedMessageResult(
    message: AsymmetricMessageServerHash,
    payload: AsymmetricMessagePayload,
  ): Promise<void> {
    if (this.handledMessages.has(message.uuid)) {
      return
    }

    this.handledMessages.add(message.uuid)

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

  getUntrustedMessagePayload(message: AsymmetricMessageServerHash): Result<AsymmetricMessagePayload> {
    const keys = this._getKeyPairs.execute()
    if (keys.isFailed()) {
      return Result.fail(keys.getError())
    }

    const result = this._getUntrustedPayload.execute({
      privateKey: keys.getValue().encryption.privateKey,
      payload: message,
    })

    if (result.isFailed()) {
      return Result.fail(result.getError())
    }

    return result
  }

  getTrustedMessagePayload(message: AsymmetricMessageServerHash): Result<AsymmetricMessagePayload> {
    const contact = this._findContact.execute({ userUuid: message.sender_uuid })
    if (contact.isFailed()) {
      return Result.fail(contact.getError())
    }

    const keys = this._getKeyPairs.execute()
    if (keys.isFailed()) {
      return Result.fail(keys.getError())
    }

    const result = this._getTrustedPayload.execute({
      privateKey: keys.getValue().encryption.privateKey,
      sender: contact.getValue(),
      ownUserUuid: this.sessions.userUuid,
      payload: message,
    })

    if (result.isFailed()) {
      return Result.fail(result.getError())
    }

    return result
  }

  async deleteMessageAfterProcessing(message: AsymmetricMessageServerHash): Promise<void> {
    await this.messageServer.deleteMessage({ messageUuid: message.uuid })
  }

  async handleTrustedVaultMetadataChangedMessage(
    _message: AsymmetricMessageServerHash,
    trustedPayload: AsymmetricMessageSharedVaultMetadataChanged,
  ): Promise<void> {
    const vault = this._getVault.execute<VaultListingInterface>({
      sharedVaultUuid: trustedPayload.data.sharedVaultUuid,
    })
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

    await this._replaceContactData.execute(trustedPayload.data.trustedContact)
  }

  async handleTrustedSenderKeypairChangedMessage(
    message: AsymmetricMessageServerHash,
    trustedPayload: AsymmetricMessageSenderKeypairChanged,
  ): Promise<void> {
    await this._createOrEditContact.execute({
      contactUuid: message.sender_uuid,
      publicKey: trustedPayload.data.newEncryptionPublicKey,
      signingPublicKey: trustedPayload.data.newSigningPublicKey,
    })
  }

  async handleTrustedSharedVaultRootKeyChangedMessage(
    _message: AsymmetricMessageServerHash,
    trustedPayload: AsymmetricMessageSharedVaultRootKeyChanged,
  ): Promise<void> {
    await this._handleRootKeyChangedMessage.execute(trustedPayload)
  }
}
