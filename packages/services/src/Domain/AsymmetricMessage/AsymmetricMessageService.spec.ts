import { GetKeyPairs } from './../Encryption/UseCase/GetKeyPairs'
import { GetVault } from './../Vault/UseCase/GetVault'
import { SessionsClientInterface } from './../Session/SessionsClientInterface'
import { EncryptionProviderInterface } from './../Encryption/EncryptionProviderInterface'
import { GetUntrustedPayload } from './UseCase/GetUntrustedPayload'
import { GetInboundMessages } from './UseCase/GetInboundMessages'
import { GetOutboundMessages } from './UseCase/GetOutboundMessages'
import { HandleRootKeyChangedMessage } from './UseCase/HandleRootKeyChangedMessage'
import { GetTrustedPayload } from './UseCase/GetTrustedPayload'
import { ReplaceContactData } from './../Contacts/UseCase/ReplaceContactData'
import { FindContact } from './../Contacts/UseCase/FindContact'
import { CreateOrEditContact } from './../Contacts/UseCase/CreateOrEditContact'
import { MutatorClientInterface } from './../Mutator/MutatorClientInterface'
import { AsymmetricMessageServer } from '@standardnotes/api'
import { AsymmetricMessageService } from './AsymmetricMessageService'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { AsymmetricMessageServerHash } from '@standardnotes/responses'
import {
  AsymmetricMessagePayloadType,
  AsymmetricMessageSenderKeypairChanged,
  AsymmetricMessageSharedVaultInvite,
  AsymmetricMessageSharedVaultMetadataChanged,
  AsymmetricMessageSharedVaultRootKeyChanged,
  AsymmetricMessageTrustedContactShare,
  KeySystemRootKeyContentSpecialized,
  TrustedContactInterface,
} from '@standardnotes/models'
import { Result } from '@standardnotes/domain-core'

describe('AsymmetricMessageService', () => {
  let sync: jest.Mocked<SyncServiceInterface>
  let mutator: jest.Mocked<MutatorClientInterface>
  let encryption: jest.Mocked<EncryptionProviderInterface>
  let sessions: jest.Mocked<SessionsClientInterface>
  let service: AsymmetricMessageService

  beforeEach(() => {
    const messageServer = {} as jest.Mocked<AsymmetricMessageServer>
    messageServer.deleteMessage = jest.fn()

    encryption = {} as jest.Mocked<EncryptionProviderInterface>
    const createOrEditContact = {} as jest.Mocked<CreateOrEditContact>
    const findContact = {} as jest.Mocked<FindContact>
    const replaceContactData = {} as jest.Mocked<ReplaceContactData>
    const getTrustedPayload = {} as jest.Mocked<GetTrustedPayload>
    const getVault = {} as jest.Mocked<GetVault>
    const handleRootKeyChangedMessage = {} as jest.Mocked<HandleRootKeyChangedMessage>
    const getOutboundMessagesUseCase = {} as jest.Mocked<GetOutboundMessages>
    const getInboundMessagesUseCase = {} as jest.Mocked<GetInboundMessages>
    const getUntrustedPayload = {} as jest.Mocked<GetUntrustedPayload>
    const getKeyPairs = {} as jest.Mocked<GetKeyPairs>

    sync = {} as jest.Mocked<SyncServiceInterface>
    sync.sync = jest.fn()

    mutator = {} as jest.Mocked<MutatorClientInterface>
    mutator.changeItem = jest.fn()

    const eventBus = {} as jest.Mocked<InternalEventBusInterface>
    eventBus.addEventHandler = jest.fn()

    service = new AsymmetricMessageService(
      encryption,
      mutator,
      sessions,
      sync,
      messageServer,
      createOrEditContact,
      findContact,
      replaceContactData,
      getTrustedPayload,
      getVault,
      handleRootKeyChangedMessage,
      getOutboundMessagesUseCase,
      getInboundMessagesUseCase,
      getUntrustedPayload,
      getKeyPairs,
      eventBus,
    )
  })

  describe('sortServerMessages', () => {
    it('should prioritize keypair changed messages over other messages', () => {
      const messages: AsymmetricMessageServerHash[] = [
        {
          uuid: 'keypair-changed-message',
          recipient_uuid: '1',
          sender_uuid: '2',
          encrypted_message: 'encrypted_message',
          created_at_timestamp: 2,
          updated_at_timestamp: 2,
          replaceability_identifier: null,
        },
        {
          uuid: 'misc-message',
          recipient_uuid: '1',
          sender_uuid: '2',
          encrypted_message: 'encrypted_message',
          created_at_timestamp: 1,
          updated_at_timestamp: 1,
          replaceability_identifier: null,
        },
      ]

      service.getUntrustedMessagePayload = jest.fn()
      service.getServerMessageType = jest.fn().mockImplementation((message) => {
        if (message.uuid === 'keypair-changed-message') {
          return AsymmetricMessagePayloadType.SenderKeypairChanged
        } else {
          return AsymmetricMessagePayloadType.ContactShare
        }
      })

      const sorted = service.sortServerMessages(messages)
      expect(sorted[0].uuid).toEqual('keypair-changed-message')
      expect(sorted[1].uuid).toEqual('misc-message')

      const reverseSorted = service.sortServerMessages(messages.reverse())
      expect(reverseSorted[0].uuid).toEqual('keypair-changed-message')
      expect(reverseSorted[1].uuid).toEqual('misc-message')
    })
  })

  describe('handleTrustedMessageResult', () => {
    it('should not double handle the same message', async () => {
      /**
       * Because message retrieval is based on a syncToken, and the server aligns syncTokens to items sent back
       * rather than messages, we may receive the same message twice. We want to keep track of processed messages
       * and avoid double processing.
       */

      const message: AsymmetricMessageServerHash = {
        uuid: 'message',
        recipient_uuid: '1',
        sender_uuid: '2',
        encrypted_message: 'encrypted_message',
        created_at_timestamp: 2,
        updated_at_timestamp: 2,
        replaceability_identifier: null,
      }

      const decryptedMessagePayload: AsymmetricMessageTrustedContactShare = {
        type: AsymmetricMessagePayloadType.ContactShare,
        data: {
          recipientUuid: '1',
          trustedContact: {} as TrustedContactInterface,
        },
      }

      service.getTrustedMessagePayload = service.getUntrustedMessagePayload = jest
        .fn()
        .mockReturnValue(Result.ok(decryptedMessagePayload))

      service.handleTrustedContactShareMessage = jest.fn()
      await service.handleTrustedMessageResult(message, decryptedMessagePayload)
      expect(service.handleTrustedContactShareMessage).toHaveBeenCalledTimes(1)

      service.handleTrustedContactShareMessage = jest.fn()
      await service.handleTrustedMessageResult(message, decryptedMessagePayload)
      expect(service.handleTrustedContactShareMessage).toHaveBeenCalledTimes(0)
    })
  })

  it('should process incoming messages oldest first', async () => {
    const messages: AsymmetricMessageServerHash[] = [
      {
        uuid: 'newer-message',
        recipient_uuid: '1',
        sender_uuid: '2',
        encrypted_message: 'encrypted_message',
        created_at_timestamp: 2,
        updated_at_timestamp: 2,
        replaceability_identifier: null,
      },
      {
        uuid: 'older-message',
        recipient_uuid: '1',
        sender_uuid: '2',
        encrypted_message: 'encrypted_message',
        created_at_timestamp: 1,
        updated_at_timestamp: 1,
        replaceability_identifier: null,
      },
    ]

    const trustedPayloadMock = { type: AsymmetricMessagePayloadType.ContactShare, data: { recipientUuid: '1' } }

    service.getTrustedMessagePayload = service.getUntrustedMessagePayload = jest
      .fn()
      .mockReturnValue(Result.ok(trustedPayloadMock))

    const handleTrustedContactShareMessageMock = jest.fn()
    service.handleTrustedContactShareMessage = handleTrustedContactShareMessageMock

    await service.handleRemoteReceivedAsymmetricMessages(messages)

    expect(handleTrustedContactShareMessageMock.mock.calls[0][0]).toEqual(messages[1])
    expect(handleTrustedContactShareMessageMock.mock.calls[1][0]).toEqual(messages[0])
  })

  it('should handle ContactShare message', async () => {
    const message: AsymmetricMessageServerHash = {
      uuid: 'message',
      recipient_uuid: '1',
      sender_uuid: '2',
      encrypted_message: 'encrypted_message',
      created_at_timestamp: 2,
      updated_at_timestamp: 2,
      replaceability_identifier: null,
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
      .mockReturnValue(Result.ok(decryptedMessagePayload))

    await service.handleRemoteReceivedAsymmetricMessages([message])

    expect(service.handleTrustedContactShareMessage).toHaveBeenCalledWith(message, decryptedMessagePayload)
  })

  it('should handle SenderKeypairChanged message', async () => {
    const message: AsymmetricMessageServerHash = {
      uuid: 'message',
      recipient_uuid: '1',
      sender_uuid: '2',
      encrypted_message: 'encrypted_message',
      created_at_timestamp: 2,
      updated_at_timestamp: 2,
      replaceability_identifier: null,
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
      .mockReturnValue(Result.ok(decryptedMessagePayload))

    await service.handleRemoteReceivedAsymmetricMessages([message])

    expect(service.handleTrustedSenderKeypairChangedMessage).toHaveBeenCalledWith(message, decryptedMessagePayload)
  })

  it('should handle SharedVaultRootKeyChanged message', async () => {
    const message: AsymmetricMessageServerHash = {
      uuid: 'message',
      recipient_uuid: '1',
      sender_uuid: '2',
      encrypted_message: 'encrypted_message',
      created_at_timestamp: 2,
      updated_at_timestamp: 2,
      replaceability_identifier: null,
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
      .mockReturnValue(Result.ok(decryptedMessagePayload))

    await service.handleRemoteReceivedAsymmetricMessages([message])

    expect(service.handleTrustedSharedVaultRootKeyChangedMessage).toHaveBeenCalledWith(message, decryptedMessagePayload)
  })

  it('should handle SharedVaultMetadataChanged message', async () => {
    const message: AsymmetricMessageServerHash = {
      uuid: 'message',
      recipient_uuid: '1',
      sender_uuid: '2',
      encrypted_message: 'encrypted_message',
      created_at_timestamp: 2,
      updated_at_timestamp: 2,
      replaceability_identifier: null,
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
      .mockReturnValue(Result.ok(decryptedMessagePayload))

    await service.handleRemoteReceivedAsymmetricMessages([message])

    expect(service.handleTrustedVaultMetadataChangedMessage).toHaveBeenCalledWith(message, decryptedMessagePayload)
  })

  it('should throw if message type is SharedVaultInvite', async () => {
    const message: AsymmetricMessageServerHash = {
      uuid: 'message',
      recipient_uuid: '1',
      sender_uuid: '2',
      encrypted_message: 'encrypted_message',
      created_at_timestamp: 2,
      updated_at_timestamp: 2,
      replaceability_identifier: null,
    }

    const decryptedMessagePayload: AsymmetricMessageSharedVaultInvite = {
      type: AsymmetricMessagePayloadType.SharedVaultInvite,
      data: {
        recipientUuid: '1',
      },
    } as AsymmetricMessageSharedVaultInvite

    service.getTrustedMessagePayload = service.getUntrustedMessagePayload = jest
      .fn()
      .mockReturnValue(Result.ok(decryptedMessagePayload))

    await expect(service.handleRemoteReceivedAsymmetricMessages([message])).rejects.toThrow(
      'Shared vault invites payloads are not handled as part of asymmetric messages',
    )
  })

  it('should delete message from server after processing', async () => {
    const message: AsymmetricMessageServerHash = {
      uuid: 'message',
      recipient_uuid: '1',
      sender_uuid: '2',
      encrypted_message: 'encrypted_message',
      created_at_timestamp: 2,
      updated_at_timestamp: 2,
      replaceability_identifier: null,
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
      .mockReturnValue(Result.ok(decryptedMessagePayload))

    await service.handleRemoteReceivedAsymmetricMessages([message])

    expect(service.deleteMessageAfterProcessing).toHaveBeenCalled()
  })
})
