import { HttpServiceInterface } from '@standardnotes/api'
import { AsymmetricMessageService } from './AsymmetricMessageService'
import { ContactServiceInterface } from './../Contacts/ContactServiceInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { AsymmetricMessageServerHash } from '@standardnotes/responses'
import { AsymmetricMessagePayloadType } from '@standardnotes/models'

describe('AsymmetricMessageService', () => {
  let service: AsymmetricMessageService

  beforeEach(() => {
    const http = {} as jest.Mocked<HttpServiceInterface>
    http.delete = jest.fn()

    const encryption = {} as jest.Mocked<EncryptionProviderInterface>
    const contacts = {} as jest.Mocked<ContactServiceInterface>
    const items = {} as jest.Mocked<ItemManagerInterface>
    const sync = {} as jest.Mocked<SyncServiceInterface>

    const eventBus = {} as jest.Mocked<InternalEventBusInterface>
    eventBus.addEventHandler = jest.fn()

    service = new AsymmetricMessageService(http, encryption, contacts, items, sync, eventBus)
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

    const trustedPayloadMock = { type: AsymmetricMessagePayloadType.ContactShare }

    service.getTrustedMessagePayload = jest.fn().mockReturnValue(trustedPayloadMock)

    const handleTrustedContactShareMessageMock = jest.fn()
    service.handleTrustedContactShareMessage = handleTrustedContactShareMessageMock

    await service.handleRemoteReceivedAsymmetricMessages(messages)

    expect(handleTrustedContactShareMessageMock.mock.calls[0][0]).toEqual(messages[1])
    expect(handleTrustedContactShareMessageMock.mock.calls[1][0]).toEqual(messages[0])
  })
})
