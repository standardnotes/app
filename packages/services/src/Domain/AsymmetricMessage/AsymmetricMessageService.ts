import { ContactServiceInterface } from './../Contacts/ContactServiceInterface'
import { AsymmetricMessageServerHash } from '@standardnotes/responses'
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
} from '@standardnotes/models'
import { HandleTrustedSharedVaultRootKeyChangedMessage } from './UseCase/HandleTrustedSharedVaultRootKeyChangedMessage'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { SessionEvent } from '../Session/SessionEvent'
import { AsymmetricMessageServer, HttpServiceInterface } from '@standardnotes/api'
import { SuccessfullyChangedCredentialsEventData } from '../Session/SuccessfullyChangedCredentialsEventData'
import { SendOwnContactChangeMessage } from './UseCase/SendOwnContactChangeMessage'

export class AsymmetricMessageService extends AbstractService implements InternalEventHandlerInterface {
  private messageServer: AsymmetricMessageServer

  constructor(
    http: HttpServiceInterface,
    private encryption: EncryptionProviderInterface,
    private contacts: ContactServiceInterface,
    private items: ItemManagerInterface,
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

  async sendOwnContactChangeEventToAllContacts(data: SuccessfullyChangedCredentialsEventData): Promise<void> {
    const useCase = new SendOwnContactChangeMessage(this.encryption, this.messageServer)

    const contacts = this.contacts.getAllContacts()

    for (const contact of contacts) {
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
    const useCase = new GetAsymmetricMessageTrustedPayload(this.encryption, this.contacts)
    for (const message of messages) {
      const trustedMessagePayload = useCase.execute({
        privateKey: this.encryption.getKeyPair().privateKey,
        message,
      })

      if (!trustedMessagePayload) {
        continue
      }

      if (trustedMessagePayload.type === AsymmetricMessagePayloadType.ContactShare) {
        await this.handleTrustedContactShareMessage(message, trustedMessagePayload)
      } else if (trustedMessagePayload.type === AsymmetricMessagePayloadType.SenderKeypairChanged) {
        await this.handleTrustedSenderKeypairChangedMessage(message, trustedMessagePayload)
      } else if (trustedMessagePayload.type === AsymmetricMessagePayloadType.SharedVaultRootKeyChanged) {
        await this.handleTrustedSharedVaultRootKeyChangedMessage(message, trustedMessagePayload)
      }
    }
  }

  private async handleTrustedContactShareMessage(
    _message: AsymmetricMessageServerHash,
    trustedPayload: AsymmetricMessageTrustedContactShare,
  ): Promise<void> {
    await this.contacts.createOrUpdateTrustedContactFromContactShare(trustedPayload.data)
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
    const useCase = new HandleTrustedSharedVaultRootKeyChangedMessage(this.items, this.sync)
    await useCase.execute(trustedPayload)
  }
}
