import { EncryptionProviderInterface } from './../Encryption/EncryptionProviderInterface'
import { GetUntrustedPayload } from './UseCase/GetUntrustedPayload'
import { GetInboundMessages } from './UseCase/GetInboundMessages'
import { GetOutboundMessages } from './UseCase/GetOutboundMessages'
import { SendOwnContactChangeMessage } from './UseCase/SendOwnContactChangeMessage'
import { HandleRootKeyChangedMessage } from './UseCase/HandleRootKeyChangedMessage'
import { GetVault } from './../Vaults/UseCase/GetVault'
import { GetTrustedPayload } from './UseCase/GetTrustedPayload'
import { ReplaceContactData } from './../Contacts/UseCase/ReplaceContactData'
import { GetAllContacts } from './../Contacts/UseCase/GetAllContacts'
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

describe('AsymmetricMessageService', () => {
  let sync: jest.Mocked<SyncServiceInterface>
  let mutator: jest.Mocked<MutatorClientInterface>
  let encryption: jest.Mocked<EncryptionProviderInterface>
  let service: AsymmetricMessageService

  beforeEach(() => {
    const messageServer = {} as jest.Mocked<AsymmetricMessageServer>
    messageServer.deleteMessage = jest.fn()

    encryption = {} as jest.Mocked<EncryptionProviderInterface>
    const createOrEditContact = {} as jest.Mocked<CreateOrEditContact>
    const findContact = {} as jest.Mocked<FindContact>
    const getAllContacts = {} as jest.Mocked<GetAllContacts>
    const replaceContactData = {} as jest.Mocked<ReplaceContactData>
    const getTrustedPayload = {} as jest.Mocked<GetTrustedPayload>
    const getVault = {} as jest.Mocked<GetVault>
    const handleRootKeyChangedMessage = {} as jest.Mocked<HandleRootKeyChangedMessage>
    const sendOwnContactChangedMessage = {} as jest.Mocked<SendOwnContactChangeMessage>
    const getOutboundMessagesUseCase = {} as jest.Mocked<GetOutboundMessages>
    const getInboundMessagesUseCase = {} as jest.Mocked<GetInboundMessages>
    const getUntrustedPayload = {} as jest.Mocked<GetUntrustedPayload>

    sync = {} as jest.Mocked<SyncServiceInterface>
    sync.sync = jest.fn()

    mutator = {} as jest.Mocked<MutatorClientInterface>
    mutator.changeItem = jest.fn()

    const eventBus = {} as jest.Mocked<InternalEventBusInterface>
    eventBus.addEventHandler = jest.fn()

    service = new AsymmetricMessageService(
      messageServer,
      encryption,
      mutator,
      createOrEditContact,
      findContact,
      getAllContacts,
      replaceContactData,
      getTrustedPayload,
      getVault,
      handleRootKeyChangedMessage,
      sendOwnContactChangedMessage,
      getOutboundMessagesUseCase,
      getInboundMessagesUseCase,
      getUntrustedPayload,
      eventBus,
    )
  })

  describe('sortServerMessages', () => {
    it('should prioritize keypair changed messages over other messages', () => {
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
})
