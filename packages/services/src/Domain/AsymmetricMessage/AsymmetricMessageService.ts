import { MutatorClientInterface } from './../Mutator/MutatorClientInterface'
import { ContactServiceInterface } from './../Contacts/ContactServiceInterface'
import { AsymmetricMessageServerHash, ClientDisplayableError } from '@standardnotes/responses'
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
} from '@standardnotes/models'
import { HandleTrustedSharedVaultRootKeyChangedMessage } from './UseCase/HandleTrustedSharedVaultRootKeyChangedMessage'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { SessionEvent } from '../Session/SessionEvent'
import { AsymmetricMessageServer, HttpServiceInterface } from '@standardnotes/api'
import { SuccessfullyChangedCredentialsEventData } from '../Session/SuccessfullyChangedCredentialsEventData'
import { SendOwnContactChangeMessage } from './UseCase/SendOwnContactChangeMessage'
import { GetOutboundAsymmetricMessages } from './UseCase/GetOutboundAsymmetricMessages'
import { GetInboundAsymmetricMessages } from './UseCase/GetInboundAsymmetricMessages'
import { GetVaultUseCase } from '../Vaults/UseCase/GetVault'

export class AsymmetricMessageService extends AbstractService implements InternalEventHandlerInterface {
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
    eventBus.addEventHandler(this, SessionEvent.SuccessfullyChangedCredentials)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === SessionEvent.SuccessfullyChangedCredentials) {
      void this.messageServer.deleteAllInboundMessages()
      void this.sendOwnContactChangeEventToAllContacts(event.payload as SuccessfullyChangedCredentialsEventData)
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

  async sendOwnContactChangeEventToAllContacts(data: SuccessfullyChangedCredentialsEventData): Promise<void> {
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

  async handleRemoteReceivedAsymmetricMessages(messages: AsymmetricMessageServerHash[]): Promise<void> {
    if (messages.length === 0) {
      return
    }

    const sortedMessages = messages.slice().sort((a, b) => a.created_at_timestamp - b.created_at_timestamp)

    for (const message of sortedMessages) {
      const trustedMessagePayload = this.getTrustedMessagePayload(message)
      if (!trustedMessagePayload) {
        continue
      }

      if (trustedMessagePayload.data.recipientUuid !== message.user_uuid) {
        continue
      }

      if (trustedMessagePayload.type === AsymmetricMessagePayloadType.ContactShare) {
        await this.handleTrustedContactShareMessage(message, trustedMessagePayload)
      } else if (trustedMessagePayload.type === AsymmetricMessagePayloadType.SenderKeypairChanged) {
        await this.handleTrustedSenderKeypairChangedMessage(message, trustedMessagePayload)
      } else if (trustedMessagePayload.type === AsymmetricMessagePayloadType.SharedVaultRootKeyChanged) {
        await this.handleTrustedSharedVaultRootKeyChangedMessage(message, trustedMessagePayload)
      } else if (trustedMessagePayload.type === AsymmetricMessagePayloadType.SharedVaultMetadataChanged) {
        await this.handleVaultMetadataChangedMessage(message, trustedMessagePayload)
      } else if (trustedMessagePayload.type === AsymmetricMessagePayloadType.SharedVaultInvite) {
        throw new Error('Shared vault invites payloads are not handled as part of asymmetric messages')
      }

      await this.deleteMessageAfterProcessing(message)
    }
  }

  getTrustedMessagePayload(message: AsymmetricMessageServerHash): AsymmetricMessagePayload | undefined {
    const useCase = new GetAsymmetricMessageTrustedPayload(this.encryption, this.contacts)

    return useCase.execute({
      privateKey: this.encryption.getKeyPair().privateKey,
      message,
    })
  }

  private async deleteMessageAfterProcessing(message: AsymmetricMessageServerHash): Promise<void> {
    await this.messageServer.deleteMessage({ messageUuid: message.uuid })
  }

  async handleVaultMetadataChangedMessage(
    _message: AsymmetricMessageServerHash,
    trustedPayload: AsymmetricMessageSharedVaultMetadataChanged,
  ): Promise<void> {
    const vault = new GetVaultUseCase(this.items).execute({ sharedVaultUuid: trustedPayload.data.sharedVaultUuid })
    if (!vault) {
      return
    }

    await this.mutator.changeItem<VaultListingMutator>(vault, (mutator) => {
      mutator.name = trustedPayload.data.name
      mutator.description = trustedPayload.data.description
    })
  }

  async handleTrustedContactShareMessage(
    _message: AsymmetricMessageServerHash,
    trustedPayload: AsymmetricMessageTrustedContactShare,
  ): Promise<void> {
    await this.contacts.createOrUpdateTrustedContactFromContactShare(trustedPayload.data.trustedContact)
  }

  private async handleTrustedSenderKeypairChangedMessage(
    message: AsymmetricMessageServerHash,
    trustedPayload: AsymmetricMessageSenderKeypairChanged,
  ): Promise<void> {
    await this.contacts.createOrEditTrustedContact({
      contactUuid: message.sender_uuid,
      publicKey: trustedPayload.data.newEncryptionPublicKey,
      signingPublicKey: trustedPayload.data.newSigningPublicKey,
    })
  }

  private async handleTrustedSharedVaultRootKeyChangedMessage(
    _message: AsymmetricMessageServerHash,
    trustedPayload: AsymmetricMessageSharedVaultRootKeyChanged,
  ): Promise<void> {
    const useCase = new HandleTrustedSharedVaultRootKeyChangedMessage(this.mutator, this.sync)
    await useCase.execute(trustedPayload)
  }
}
