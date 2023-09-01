import { AsymmetricMessageServerHash } from '@standardnotes/responses'
import { AsymmetricMessagePayload, TrustedContactInterface } from '@standardnotes/models'
import { DecryptMessage } from '../../Encryption/UseCase/Asymmetric/DecryptMessage'
import { Result } from '@standardnotes/domain-core'
import { GetTrustedPayload } from './GetTrustedPayload'

describe('GetTrustedPayload', () => {
  let decryptMessage: jest.Mocked<DecryptMessage>
  let getTrustedPayload: GetTrustedPayload

  beforeEach(() => {
    decryptMessage = {} as jest.Mocked<DecryptMessage>
    decryptMessage.execute = jest.fn()

    getTrustedPayload = new GetTrustedPayload(decryptMessage)
  })

  describe('execute', () => {
    const mockDto = {
      privateKey: 'test-private-key',
      payload: {} as AsymmetricMessageServerHash,
      sender: {} as TrustedContactInterface,
      ownUserUuid: 'test-user-uuid',
    }

    it('should return failure when decryption fails', () => {
      decryptMessage.execute = jest.fn().mockReturnValue(Result.fail('Decryption failed'))

      const result = getTrustedPayload.execute(mockDto)

      expect(result.isFailed()).toBe(true)
      expect(result.getError()).toBe('Decryption failed')
    })

    it('should return failure when recipientUuid is not equal to ownUserUuid', () => {
      const mockPayload: AsymmetricMessagePayload = {
        data: {
          recipientUuid: 'another-user-uuid',
        },
      } as AsymmetricMessagePayload
      decryptMessage.execute = jest.fn().mockReturnValue(Result.ok(mockPayload))

      const result = getTrustedPayload.execute(mockDto)

      expect(result.isFailed()).toBe(true)
      expect(result.getError()).toBe('Message is not for this user')
    })

    it('should return success when recipientUuid is equal to ownUserUuid', () => {
      const mockPayload: AsymmetricMessagePayload = {
        data: {
          recipientUuid: 'test-user-uuid',
        },
      } as AsymmetricMessagePayload
      decryptMessage.execute = jest.fn().mockReturnValue(Result.ok(mockPayload))

      const result = getTrustedPayload.execute(mockDto)

      expect(result.isFailed()).toBe(false)
      expect(result.getValue()).toBe(mockPayload)
    })
  })
})
