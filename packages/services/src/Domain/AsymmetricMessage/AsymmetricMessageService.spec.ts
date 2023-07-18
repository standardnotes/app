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
  AsymmetricMessageSenderKeypairChanged,
  AsymmetricMessageSenderKeysetRevoked,
  AsymmetricMessageSharedVaultInvite,
  AsymmetricMessageSharedVaultMetadataChanged,
  AsymmetricMessageSharedVaultRootKeyChanged,
  AsymmetricMessageTrustedContactShare,
  ContactPublicKeySetInterface,
  KeySystemRootKeyContentSpecialized,
  MutationType,
  PayloadEmitSource,
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
    contacts.createOrUpdateTrustedContactFromContactShare = jest.fn()
    contacts.createOrEditTrustedContact = jest.fn()

    const items = {} as jest.Mocked<ItemManagerInterface>

    sync = {} as jest.Mocked<SyncServiceInterface>
    sync.sync = jest.fn()

    mutator = {} as jest.Mocked<MutatorClientInterface>
    mutator.changeItem = jest.fn()

    const eventBus = {} as jest.Mocked<InternalEventBusInterface>
    eventBus.addEventHandler = jest.fn()

    service = new AsymmetricMessageService(http, encryption, contacts, items, mutator, sync, eventBus)
  })

  describe('sortServerMessages', () => {
    it('should prioritize keyset revocation messages over other misc messages', () => {
      const messages: AsymmetricMessageServerHash[] = [
        {
          uuid: 'newer-revocation-message',
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

      service.getUntrustedMessagePayload = jest.fn()
      service.getServerMessageType = jest.fn().mockImplementation((message) => {
        if (message.uuid === 'newer-revocation-message') {
          return AsymmetricMessagePayloadType.SenderKeysetRevoked
        } else {
          return AsymmetricMessagePayloadType.ContactShare
        }
      })

      const sorted = service.sortServerMessages(messages)
      expect(sorted[0].uuid).toEqual('newer-revocation-message')
      expect(sorted[1].uuid).toEqual('older-message')

      const reverseSorted = service.sortServerMessages(messages.reverse())
      expect(reverseSorted[0].uuid).toEqual('newer-revocation-message')
      expect(reverseSorted[1].uuid).toEqual('older-message')
    })

    it('should prioritize keypair changed messages over keyset revoked messages', () => {
      const messages: AsymmetricMessageServerHash[] = [
        {
          uuid: 'keypair-changed-message',
          user_uuid: '1',
          sender_uuid: '2',
          encrypted_message: 'encrypted_message',
          created_at_timestamp: 2,
          updated_at_timestamp: 2,
        },
        {
          uuid: 'keyset-revoked-message',
          user_uuid: '1',
          sender_uuid: '2',
          encrypted_message: 'encrypted_message',
          created_at_timestamp: 1,
          updated_at_timestamp: 1,
        },
        {
          uuid: 'misc-message',
          user_uuid: '1',
          sender_uuid: '2',
          encrypted_message: 'encrypted_message',
          created_at_timestamp: 1,
          updated_at_timestamp: 1,
        },
      ]

      service.getUntrustedMessagePayload = jest.fn()
      service.getServerMessageType = jest.fn().mockImplementation((message) => {
        if (message.uuid === 'keyset-revoked-message') {
          return AsymmetricMessagePayloadType.SenderKeysetRevoked
        } else if (message.uuid === 'keypair-changed-message') {
          return AsymmetricMessagePayloadType.SenderKeypairChanged
        } else {
          return AsymmetricMessagePayloadType.ContactShare
        }
      })

      const sorted = service.sortServerMessages(messages)
      expect(sorted[0].uuid).toEqual('keypair-changed-message')
      expect(sorted[1].uuid).toEqual('keyset-revoked-message')
      expect(sorted[2].uuid).toEqual('misc-message')

      const reverseSorted = service.sortServerMessages(messages.reverse())
      expect(reverseSorted[0].uuid).toEqual('keypair-changed-message')
      expect(reverseSorted[1].uuid).toEqual('keyset-revoked-message')
      expect(reverseSorted[2].uuid).toEqual('misc-message')
    })
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

    service.getTrustedMessagePayload = service.getUntrustedMessagePayload = jest
      .fn()
      .mockReturnValue(trustedPayloadMock)

    const handleTrustedContactShareMessageMock = jest.fn()
    service.handleTrustedContactShareMessage = handleTrustedContactShareMessageMock

    await service.handleRemoteReceivedAsymmetricMessages(messages)

    expect(handleTrustedContactShareMessageMock.mock.calls[0][0]).toEqual(messages[1])
    expect(handleTrustedContactShareMessageMock.mock.calls[1][0]).toEqual(messages[0])
  })

  it('should prioritize keyset revocation messages to be processed before anything else', async () => {
    const messages: AsymmetricMessageServerHash[] = [
      {
        uuid: 'newer-keyset-revocation-message',
        user_uuid: '1',
        sender_uuid: '2',
        encrypted_message: 'encrypted_message',
        created_at_timestamp: 2,
        updated_at_timestamp: 2,
      },
      {
        uuid: 'older-misc-message',
        user_uuid: '1',
        sender_uuid: '2',
        encrypted_message: 'encrypted_message',
        created_at_timestamp: 1,
        updated_at_timestamp: 1,
      },
    ]

    const keysetRevokedMessage = {
      type: AsymmetricMessagePayloadType.SenderKeysetRevoked,
      data: { recipientUuid: '1' },
    }
    const otherMessage = { type: AsymmetricMessagePayloadType.ContactShare, data: { recipientUuid: '1' } }

    service.getTrustedMessagePayload = service.getUntrustedMessagePayload = jest.fn().mockImplementation((message) => {
      if (message.uuid === 'newer-keyset-revocation-message') {
        return keysetRevokedMessage
      } else {
        return otherMessage
      }
    })

    const handleTrustedSenderKeysetRevokedMessageMock = jest.fn()
    service.handleTrustedSenderKeysetRevokedMessage = handleTrustedSenderKeysetRevokedMessageMock

    const handleTrustedContactShareMessageMock = jest.fn()
    service.handleTrustedContactShareMessage = handleTrustedContactShareMessageMock

    await service.handleRemoteReceivedAsymmetricMessages(messages)

    expect(handleTrustedSenderKeysetRevokedMessageMock.mock.invocationCallOrder[0]).toBeLessThan(
      handleTrustedContactShareMessageMock.mock.invocationCallOrder[0],
    )
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

    const decryptedMessagePayload: AsymmetricMessageTrustedContactShare = {
      type: AsymmetricMessagePayloadType.ContactShare,
      data: {
        recipientUuid: '1',
        trustedContact: {} as TrustedContactInterface,
      },
    }

    service.handleTrustedContactShareMessage = jest.fn()
    service.getTrustedMessagePayload = service.getUntrustedMessagePayload = jest
      .fn()
      .mockReturnValue(decryptedMessagePayload)

    await service.handleRemoteReceivedAsymmetricMessages([message])

    expect(service.handleTrustedContactShareMessage).toHaveBeenCalledWith(message, decryptedMessagePayload)
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

    const decryptedMessagePayload: AsymmetricMessageSenderKeypairChanged = {
      type: AsymmetricMessagePayloadType.SenderKeypairChanged,
      data: {
        recipientUuid: '1',
        newEncryptionPublicKey: 'new-encryption-public-key',
        newSigningPublicKey: 'new-signing-public-key',
      },
    }

    service.handleTrustedSenderKeypairChangedMessage = jest.fn()
    service.getTrustedMessagePayload = service.getUntrustedMessagePayload = jest
      .fn()
      .mockReturnValue(decryptedMessagePayload)

    await service.handleRemoteReceivedAsymmetricMessages([message])

    expect(service.handleTrustedSenderKeypairChangedMessage).toHaveBeenCalledWith(message, decryptedMessagePayload)
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

    const decryptedMessagePayload: AsymmetricMessageSharedVaultRootKeyChanged = {
      type: AsymmetricMessagePayloadType.SharedVaultRootKeyChanged,
      data: {
        recipientUuid: '1',
        rootKey: {} as KeySystemRootKeyContentSpecialized,
      },
    }

    service.handleTrustedSharedVaultRootKeyChangedMessage = jest.fn()
    service.getTrustedMessagePayload = service.getUntrustedMessagePayload = jest
      .fn()
      .mockReturnValue(decryptedMessagePayload)

    await service.handleRemoteReceivedAsymmetricMessages([message])

    expect(service.handleTrustedSharedVaultRootKeyChangedMessage).toHaveBeenCalledWith(message, decryptedMessagePayload)
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

    const decryptedMessagePayload: AsymmetricMessageSharedVaultMetadataChanged = {
      type: AsymmetricMessagePayloadType.SharedVaultMetadataChanged,
      data: {
        recipientUuid: '1',
        sharedVaultUuid: 'shared-vault-uuid',
        name: 'Vault name',
        description: 'Vault description',
      },
    }

    service.handleTrustedVaultMetadataChangedMessage = jest.fn()
    service.getTrustedMessagePayload = service.getUntrustedMessagePayload = jest
      .fn()
      .mockReturnValue(decryptedMessagePayload)

    await service.handleRemoteReceivedAsymmetricMessages([message])

    expect(service.handleTrustedVaultMetadataChangedMessage).toHaveBeenCalledWith(message, decryptedMessagePayload)
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

    const decryptedMessagePayload: AsymmetricMessageSenderKeysetRevoked = {
      type: AsymmetricMessagePayloadType.SenderKeysetRevoked,
      data: {
        recipientUuid: '1',
        revokedPublicKey: 'revoked-public-key',
        revokedSigningPublicKey: 'revoked-signing-public-key',
      },
    }

    service.handleTrustedSenderKeysetRevokedMessage = jest.fn()
    service.getTrustedMessagePayload = service.getUntrustedMessagePayload = jest
      .fn()
      .mockReturnValue(decryptedMessagePayload)

    await service.handleRemoteReceivedAsymmetricMessages([message])

    expect(service.handleTrustedSenderKeysetRevokedMessage).toHaveBeenCalledWith(message, decryptedMessagePayload)
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

    const decryptedMessagePayload: AsymmetricMessageSharedVaultInvite = {
      type: AsymmetricMessagePayloadType.SharedVaultInvite,
      data: {
        recipientUuid: '1',
      },
    } as AsymmetricMessageSharedVaultInvite

    service.getTrustedMessagePayload = service.getUntrustedMessagePayload = jest
      .fn()
      .mockReturnValue(decryptedMessagePayload)

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

    const decryptedMessagePayload: AsymmetricMessageTrustedContactShare = {
      type: AsymmetricMessagePayloadType.ContactShare,
      data: {
        recipientUuid: '1',
        trustedContact: {} as TrustedContactInterface,
      },
    }

    service.deleteMessageAfterProcessing = jest.fn()
    service.handleTrustedContactShareMessage = jest.fn()
    service.getTrustedMessagePayload = service.getUntrustedMessagePayload = jest
      .fn()
      .mockReturnValue(decryptedMessagePayload)

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
      contacts.findTrustedContact = jest.fn().mockReturnValue(senderContact)

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

      expect(mutator.changeItem).toHaveBeenCalledWith(
        senderContact,
        expect.any(Function),
        MutationType.UpdateUserTimestamps,
        PayloadEmitSource.RemoteRetrieved,
      )
      expect(sync.sync).toHaveBeenCalled()
    })
  })
})
