import { MutatorClientInterface } from './../Mutator/MutatorClientInterface'
import { HttpServiceInterface } from '@standardnotes/api'
import { AsymmetricMessageService } from './AsymmetricMessageService'
import { ContactServiceInterface } from './../Contacts/ContactServiceInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { AsymmetricMessageServerHash } from '@standardnotes/responses'
import {
  AsymmetricMessagePayloadType,
  AsymmetricMessageSenderKeysetRevoked,
  ContactPublicKeySetInterface,
  TrustedContactInterface,
} from '@standardnotes/models'

describe('AsymmetricMessageService', () => {
  let service: AsymmetricMessageService
  let contacts: jest.Mocked<ContactServiceInterface>
  let mutator: jest.Mocked<MutatorClientInterface>
  let sync: jest.Mocked<SyncServiceInterface>

  beforeEach(() => {
    const http = {} as jest.Mocked<HttpServiceInterface>
    http.delete = jest.fn()

    const encryption = {} as jest.Mocked<EncryptionProviderInterface>
    contacts = {} as jest.Mocked<ContactServiceInterface>
    const items = {} as jest.Mocked<ItemManagerInterface>
    sync = {} as jest.Mocked<SyncServiceInterface>
    mutator = {} as jest.Mocked<MutatorClientInterface>

    const eventBus = {} as jest.Mocked<InternalEventBusInterface>
    eventBus.addEventHandler = jest.fn()

    service = new AsymmetricMessageService(http, encryption, contacts, items, mutator, sync, eventBus)
  })

  it('should process incoming messages oldest first', async () => {
    const messages: AsymmetricMessageServerHash[] = [
      {
        uuid: 'newer-message',
        user_uuid: '1',
        sender_uuid: '2',
        encrypted_message: 'encrypted_message',
        created_at_timestamp: 2,
        updated_at_timestamp: 2,
      },
      {
        uuid: 'older-message',
        user_uuid: '1',
        sender_uuid: '2',
        encrypted_message: 'encrypted_message',
        created_at_timestamp: 1,
        updated_at_timestamp: 1,
      },
    ]

    const trustedPayloadMock = { type: AsymmetricMessagePayloadType.ContactShare, data: { recipientUuid: '1' } }

    service.getTrustedMessagePayload = jest.fn().mockReturnValue(trustedPayloadMock)

    const handleTrustedContactShareMessageMock = jest.fn()
    service.handleTrustedContactShareMessage = handleTrustedContactShareMessageMock

    await service.handleRemoteReceivedAsymmetricMessages(messages)

    expect(handleTrustedContactShareMessageMock.mock.calls[0][0]).toEqual(messages[1])
    expect(handleTrustedContactShareMessageMock.mock.calls[1][0]).toEqual(messages[0])
  })

  it('should handle ContactShare message', async () => {
    const message: AsymmetricMessageServerHash = {
      uuid: 'message',
      user_uuid: '1',
      sender_uuid: '2',
      encrypted_message: 'encrypted_message',
      created_at_timestamp: 2,
      updated_at_timestamp: 2,
    }

    service.getTrustedMessagePayload = jest.fn().mockReturnValue({
      type: AsymmetricMessagePayloadType.ContactShare,
    })

    await service.handleRemoteReceivedAsymmetricMessages([message])

    expect(service.handleTrustedContactShareMessage).toHaveBeenCalledWith(message)
  })

  it('should handle SenderKeypairChanged message', async () => {
    const message: AsymmetricMessageServerHash = {
      uuid: 'message',
      user_uuid: '1',
      sender_uuid: '2',
      encrypted_message: 'encrypted_message',
      created_at_timestamp: 2,
      updated_at_timestamp: 2,
    }

    service.getTrustedMessagePayload = jest.fn().mockReturnValue({
      type: AsymmetricMessagePayloadType.SenderKeypairChanged,
    })

    await service.handleRemoteReceivedAsymmetricMessages([message])

    expect(service.handleTrustedSenderKeypairChangedMessage).toHaveBeenCalledWith(message)
  })

  it('should handle SharedVaultRootKeyChanged message', async () => {
    const message: AsymmetricMessageServerHash = {
      uuid: 'message',
      user_uuid: '1',
      sender_uuid: '2',
      encrypted_message: 'encrypted_message',
      created_at_timestamp: 2,
      updated_at_timestamp: 2,
    }

    service.getTrustedMessagePayload = jest.fn().mockReturnValue({
      type: AsymmetricMessagePayloadType.SharedVaultRootKeyChanged,
    })

    await service.handleRemoteReceivedAsymmetricMessages([message])

    expect(service.handleTrustedSharedVaultRootKeyChangedMessage).toHaveBeenCalledWith(message)
  })

  it('should handle SharedVaultMetadataChanged message', async () => {
    const message: AsymmetricMessageServerHash = {
      uuid: 'message',
      user_uuid: '1',
      sender_uuid: '2',
      encrypted_message: 'encrypted_message',
      created_at_timestamp: 2,
      updated_at_timestamp: 2,
    }

    service.getTrustedMessagePayload = jest.fn().mockReturnValue({
      type: AsymmetricMessagePayloadType.SharedVaultMetadataChanged,
    })

    await service.handleRemoteReceivedAsymmetricMessages([message])

    expect(service.handleTrustedVaultMetadataChangedMessage).toHaveBeenCalledWith(message)
  })

  it('should handle SenderKeysetRevoked message', async () => {
    const message: AsymmetricMessageServerHash = {
      uuid: 'message',
      user_uuid: '1',
      sender_uuid: '2',
      encrypted_message: 'encrypted_message',
      created_at_timestamp: 2,
      updated_at_timestamp: 2,
    }

    service.getTrustedMessagePayload = jest.fn().mockReturnValue({
      type: AsymmetricMessagePayloadType.SenderKeysetRevoked,
    })

    await service.handleRemoteReceivedAsymmetricMessages([message])

    expect(service.handleTrustedSenderKeysetRevokedMessage).toHaveBeenCalledWith(message)
  })

  it('should throw if message type is SharedVaultInvite', async () => {
    const message: AsymmetricMessageServerHash = {
      uuid: 'message',
      user_uuid: '1',
      sender_uuid: '2',
      encrypted_message: 'encrypted_message',
      created_at_timestamp: 2,
      updated_at_timestamp: 2,
    }

    service.getTrustedMessagePayload = jest.fn().mockReturnValue({
      type: AsymmetricMessagePayloadType.SharedVaultInvite,
    })

    await expect(service.handleRemoteReceivedAsymmetricMessages([message])).rejects.toThrow(
      'Shared vault invites payloads are not handled as part of asymmetric messages',
    )
  })

  it('should delete message from server after processing', async () => {
    const message: AsymmetricMessageServerHash = {
      uuid: 'message',
      user_uuid: '1',
      sender_uuid: '2',
      encrypted_message: 'encrypted_message',
      created_at_timestamp: 2,
      updated_at_timestamp: 2,
    }

    service.getTrustedMessagePayload = jest.fn().mockReturnValue({
      type: AsymmetricMessagePayloadType.ContactShare,
    })

    await service.handleRemoteReceivedAsymmetricMessages([message])

    expect(service.deleteMessageAfterProcessing).toHaveBeenCalled()
  })

  describe('handleTrustedSenderKeysetRevokedMessage', () => {
    it('should edit contact and revoke key set', async () => {
      const senderContact = {
        name: 'Other',
        contactUuid: '456',
        publicKeySet: {} as ContactPublicKeySetInterface,
        isMe: false,
      } as jest.Mocked<TrustedContactInterface>

      contacts.getAllContacts = jest.fn().mockReturnValue([senderContact])

      const message: AsymmetricMessageServerHash = {
        uuid: 'message',
        user_uuid: '1',
        sender_uuid: '456',
        encrypted_message: 'encrypted_message',
        created_at_timestamp: 2,
        updated_at_timestamp: 2,
      }

      const messagePayload: AsymmetricMessageSenderKeysetRevoked = {
        type: AsymmetricMessagePayloadType.SenderKeysetRevoked,
        data: {
          recipientUuid: '1',
          revokedPublicKey: 'revoked-public-key',
          revokedSigningPublicKey: 'revoked-signing-public-key',
        },
      }

      await service.handleTrustedSenderKeysetRevokedMessage(message, messagePayload)

      expect(mutator.changeItem).toHaveBeenCalledWith(senderContact, expect.any(Function))
      expect(sync.sync).toHaveBeenCalled()
    })
  })
})
