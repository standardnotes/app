import { HandleKeyPairChange } from './HandleKeyPairChange'
import { Result } from '@standardnotes/domain-core'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { LoggerInterface } from '@standardnotes/utils'

describe('HandleKeyPairChange', () => {
  let useCase: HandleKeyPairChange
  let mockSelfContactManager: any
  let mockInvitesServer: any
  let mockMessageServer: any
  let mockReuploadAllInvites: any
  let mockResendAllMessages: any
  let mockGetAllContacts: any
  let mockCreateOrEditContact: any
  let mockSendOwnContactChangedMessage: any
  let logger: LoggerInterface

  const dto = {
    newKeys: {
      encryption: <PkcKeyPair>{
        publicKey: 'new-encryption-public-key',
        privateKey: 'new-encryption-private-key',
      },
      signing: <PkcKeyPair>{
        publicKey: 'new-signing-public-key',
        privateKey: 'new-signing-private-key',
      },
    },
    previousKeys: {
      encryption: <PkcKeyPair>{
        publicKey: 'previous-encryption-public-key',
        privateKey: 'previous-encryption-private-key',
      },
      signing: <PkcKeyPair>{
        publicKey: 'previous-signing-public-key',
        privateKey: 'previous-signing-private-key',
      },
    },
  }

  beforeEach(() => {
    mockSelfContactManager = {
      updateWithNewPublicKeySet: jest.fn().mockReturnValue({}),
    }

    mockInvitesServer = {
      deleteAllInboundInvites: jest.fn().mockReturnValue({}),
    }

    mockMessageServer = {
      deleteAllInboundMessages: jest.fn().mockReturnValue({}),
    }

    mockReuploadAllInvites = {
      execute: jest.fn().mockReturnValue(Result.ok()),
    }

    mockResendAllMessages = {
      execute: jest.fn().mockReturnValue(Result.ok()),
    }

    mockGetAllContacts = {
      execute: jest.fn().mockReturnValue(Result.ok()),
    }

    mockSendOwnContactChangedMessage = {
      execute: jest.fn().mockReturnValue(Result.ok()),
    }

    mockCreateOrEditContact = {
      execute: jest.fn().mockReturnValue(Result.ok()),
    }

    logger = {} as jest.Mocked<LoggerInterface>
    logger.error = jest.fn()

    useCase = new HandleKeyPairChange(
      mockSelfContactManager,
      mockInvitesServer,
      mockMessageServer,
      mockReuploadAllInvites,
      mockResendAllMessages,
      mockGetAllContacts,
      mockSendOwnContactChangedMessage,
      mockCreateOrEditContact,
      logger,
    )
  })

  it('should handle key pair change correctly', async () => {
    mockGetAllContacts.execute.mockReturnValue(Result.ok([]))

    const result = await useCase.execute(dto)

    expect(mockReuploadAllInvites.execute).toBeCalledWith({ keys: dto.newKeys, previousKeys: dto.previousKeys })
    expect(mockResendAllMessages.execute).toBeCalledWith({ keys: dto.newKeys, previousKeys: dto.previousKeys })
    expect(mockSendOwnContactChangedMessage.execute).not.toBeCalled()
    expect(mockMessageServer.deleteAllInboundMessages).toBeCalled()
    expect(mockInvitesServer.deleteAllInboundInvites).toBeCalled()

    expect(result.isFailed()).toBe(false)
  })

  it('should handle sending contact change event to all contacts', async () => {
    const contact = { isMe: false }
    mockGetAllContacts.execute.mockReturnValue(Result.ok([contact]))

    await useCase.execute(dto)

    expect(mockSendOwnContactChangedMessage.execute).toBeCalledWith({
      senderOldKeyPair: dto.previousKeys.encryption,
      senderOldSigningKeyPair: dto.previousKeys.signing,
      senderNewKeyPair: dto.newKeys.encryption,
      senderNewSigningKeyPair: dto.newKeys.signing,
      contact,
    })
  })

  it('should not send contact change event if previous keys are missing', async () => {
    const contact = { isMe: false }
    mockGetAllContacts.execute.mockReturnValue(Result.ok([contact]))

    await useCase.execute({ newKeys: dto.newKeys })

    expect(mockSendOwnContactChangedMessage.execute).not.toBeCalled()
  })

  it('should not send contact change event if getAllContacts fails', async () => {
    mockGetAllContacts.execute.mockReturnValue(Result.fail('Some error'))

    await useCase.execute(dto)

    expect(mockSendOwnContactChangedMessage.execute).not.toBeCalled()
  })

  it('should not send contact change event for self contact', async () => {
    const contact = { isMe: true }
    mockGetAllContacts.execute.mockReturnValue(Result.ok([contact]))

    await useCase.execute(dto)

    expect(mockSendOwnContactChangedMessage.execute).not.toBeCalled()
  })

  it('should reupload invites and resend messages before sending contact change message', async () => {
    const contact = { isMe: false }
    mockGetAllContacts.execute.mockReturnValue(Result.ok([contact]))

    await useCase.execute(dto)

    const callOrder = [
      mockReuploadAllInvites.execute,
      mockResendAllMessages.execute,
      mockSendOwnContactChangedMessage.execute,
    ].map((fn) => fn.mock.invocationCallOrder[0])

    for (let i = 0; i < callOrder.length - 1; i++) {
      expect(callOrder[i]).toBeLessThan(callOrder[i + 1])
    }
  })
})
