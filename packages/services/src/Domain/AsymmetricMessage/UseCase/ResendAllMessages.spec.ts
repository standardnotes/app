import { ResendAllMessages } from './ResendAllMessages'
import { Result } from '@standardnotes/domain-core'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { AsymmetricMessagePayloadType } from '@standardnotes/models'

describe('ResendAllMessages', () => {
  let mockDecryptOwnMessage: any
  let mockMessageServer: any
  let mockResendMessage: any
  let mockFindContact: any

  let useCase: ResendAllMessages
  let params: {
    keys: { encryption: PkcKeyPair; signing: PkcKeyPair }
    previousKeys?: { encryption: PkcKeyPair; signing: PkcKeyPair }
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockDecryptOwnMessage = {
      execute: jest.fn(),
    }

    mockMessageServer = {
      getOutboundUserMessages: jest.fn(),
      deleteMessage: jest.fn(),
    }

    mockResendMessage = {
      execute: jest.fn(),
    }

    mockFindContact = {
      execute: jest.fn(),
    }

    useCase = new ResendAllMessages(mockResendMessage, mockDecryptOwnMessage, mockMessageServer, mockFindContact)
    params = {
      keys: {
        encryption: { publicKey: 'new_public_key', privateKey: 'new_private_key' },
        signing: { publicKey: 'new_public_key', privateKey: 'new_private_key' },
      },
    }
  })

  it('should successfully resend all messages', async () => {
    const messages = {
      data: { messages: [{ recipient_uuid: 'uuid', uuid: 'uuid', encrypted_message: 'encrypted_message' }] },
    }
    const recipient = { publicKeySet: { encryption: 'public_key' } }
    const decryptedMessage = { type: AsymmetricMessagePayloadType.ContactShare }

    mockMessageServer.getOutboundUserMessages.mockReturnValue(messages)
    mockFindContact.execute.mockReturnValue(Result.ok(recipient))
    mockDecryptOwnMessage.execute.mockReturnValue(Result.ok(decryptedMessage))

    const result = await useCase.execute(params)

    expect(result).toEqual(Result.ok())
    expect(mockMessageServer.getOutboundUserMessages).toHaveBeenCalled()
    expect(mockFindContact.execute).toHaveBeenCalled()
    expect(mockDecryptOwnMessage.execute).toHaveBeenCalled()
    expect(mockResendMessage.execute).toHaveBeenCalled()
    expect(mockMessageServer.deleteMessage).toHaveBeenCalled()
  })

  it('should handle errors while getting outbound user messages', async () => {
    mockMessageServer.getOutboundUserMessages.mockReturnValue({ data: { error: 'Error' } })

    const result = await useCase.execute(params)

    expect(result.isFailed()).toBeTruthy()
    expect(result.getError()).toBe('Failed to get outbound user messages')
  })

  it('should handle errors while finding contact', async () => {
    const messages = {
      data: { messages: [{ recipient_uuid: 'uuid', uuid: 'uuid', encrypted_message: 'encrypted_message' }] },
    }

    mockMessageServer.getOutboundUserMessages.mockReturnValue(messages)
    mockFindContact.execute.mockReturnValue(Result.fail('Contact not found'))

    const result = await useCase.execute(params)

    expect(result.isFailed()).toBeTruthy()
    expect(result.getError()).toContain('Contact not found')
  })

  it('should skip messages of excluded types', async () => {
    const messages = {
      data: {
        messages: [
          { recipient_uuid: 'uuid', uuid: 'uuid', encrypted_message: 'encrypted_message' },
          { recipient_uuid: 'uuid2', uuid: 'uuid2', encrypted_message: 'encrypted_message2' },
        ],
      },
    }
    const recipient = { publicKeySet: { encryption: 'public_key' } }
    const decryptedMessage1 = { type: AsymmetricMessagePayloadType.SenderKeypairChanged }
    const decryptedMessage2 = { type: AsymmetricMessagePayloadType.ContactShare }

    mockMessageServer.getOutboundUserMessages.mockReturnValue(messages)
    mockFindContact.execute.mockReturnValue(Result.ok(recipient))

    mockDecryptOwnMessage.execute
      .mockReturnValueOnce(Result.ok(decryptedMessage1))
      .mockReturnValueOnce(Result.ok(decryptedMessage2))

    const result = await useCase.execute(params)

    expect(result).toEqual(Result.ok())
    expect(mockMessageServer.getOutboundUserMessages).toHaveBeenCalled()
    expect(mockFindContact.execute).toHaveBeenCalledTimes(2)
    expect(mockDecryptOwnMessage.execute).toHaveBeenCalledTimes(2)
    expect(mockResendMessage.execute).toHaveBeenCalledTimes(1)
    expect(mockMessageServer.deleteMessage).toHaveBeenCalledTimes(1)
    expect(mockResendMessage.execute).toHaveBeenCalledWith(
      expect.objectContaining({ rawMessage: messages.data.messages[1] }),
    )
    expect(mockMessageServer.deleteMessage).toHaveBeenCalledWith({ messageUuid: messages.data.messages[1].uuid })
  })
})
