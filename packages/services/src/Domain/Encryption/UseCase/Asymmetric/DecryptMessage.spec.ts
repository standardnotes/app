import {
  ContactPublicKeySet,
  ContactPublicKeySetInterface,
  PublicKeyTrustStatus,
  TrustedContactInterface,
  ProtocolVersion,
} from '@standardnotes/models'
import { DecryptMessage } from './DecryptMessage'
import { OperatorInterface, EncryptionOperatorsInterface } from '@standardnotes/encryption'

function createMockPublicKeySetChain(): ContactPublicKeySetInterface {
  const nMinusOne = new ContactPublicKeySet({
    encryption: 'encryption-public-key-n-1',
    signing: 'signing-public-key-n-1',
    timestamp: new Date(-1),
    previousKeySet: undefined,
  })

  const root = new ContactPublicKeySet({
    encryption: 'encryption-public-key',
    signing: 'signing-public-key',
    timestamp: new Date(),
    previousKeySet: nMinusOne,
  })

  return root
}

describe('DecryptMessage', () => {
  let usecase: DecryptMessage
  let operator: jest.Mocked<OperatorInterface>

  beforeEach(() => {
    operator = {} as jest.Mocked<OperatorInterface>
    operator.versionForAsymmetricallyEncryptedString = jest.fn().mockReturnValue(ProtocolVersion.V004)

    const operators = {} as jest.Mocked<EncryptionOperatorsInterface>
    operators.defaultOperator = jest.fn().mockReturnValue(operator)
    operators.operatorForVersion = jest.fn().mockReturnValue(operator)

    usecase = new DecryptMessage(operators)
  })

  it('should fail if fails to decrypt', () => {
    operator.asymmetricDecrypt = jest.fn().mockReturnValue(null)
    const result = usecase.execute({
      message: 'encrypted',
      sender: undefined,
      privateKey: 'private-key',
    })

    expect(result.isFailed()).toEqual(true)
    expect(result.getError()).toEqual('Failed to decrypt message')
  })

  it('should fail if signature is invalid', () => {
    operator.asymmetricDecrypt = jest.fn().mockReturnValue({
      plaintext: 'decrypted',
      signatureVerified: false,
      signaturePublicKey: 'signing-public-key',
      senderPublicKey: 'encryption-public-key',
    })

    const result = usecase.execute({
      message: 'encrypted',
      sender: undefined,
      privateKey: 'private-key',
    })

    expect(result.isFailed()).toEqual(true)
    expect(result.getError()).toEqual('Failed to verify signature')
  })

  describe('with trusted sender', () => {
    it('should fail if encryption public key is not trusted', () => {
      operator.asymmetricDecrypt = jest.fn().mockReturnValue({
        plaintext: 'decrypted',
        signatureVerified: true,
        signaturePublicKey: 'signing-public-key',
        senderPublicKey: 'encryption-public-key',
      })

      const senderContact = {
        name: 'Other',
        contactUuid: '456',
        publicKeySet: createMockPublicKeySetChain(),
        isMe: false,
      } as jest.Mocked<TrustedContactInterface>

      senderContact.getTrustStatusForPublicKey = jest.fn().mockReturnValue(PublicKeyTrustStatus.NotTrusted)

      const result = usecase.execute({
        message: 'encrypted',
        sender: senderContact,
        privateKey: 'private-key',
      })

      expect(result.isFailed()).toEqual(true)
      expect(result.getError()).toEqual('Sender public key is not trusted')
    })

    it('should fail if signing public key is not trusted', () => {
      operator.asymmetricDecrypt = jest.fn().mockReturnValue({
        plaintext: 'decrypted',
        signatureVerified: true,
        signaturePublicKey: 'signing-public-key',
        senderPublicKey: 'encryption-public-key',
      })

      const senderContact = {
        name: 'Other',
        contactUuid: '456',
        publicKeySet: createMockPublicKeySetChain(),
        isMe: false,
      } as jest.Mocked<TrustedContactInterface>

      senderContact.getTrustStatusForPublicKey = jest.fn().mockReturnValue(PublicKeyTrustStatus.Trusted)
      senderContact.getTrustStatusForSigningPublicKey = jest.fn().mockReturnValue(PublicKeyTrustStatus.NotTrusted)

      const result = usecase.execute({
        message: 'encrypted',
        sender: senderContact,
        privateKey: 'private-key',
      })

      expect(result.isFailed()).toEqual(true)
      expect(result.getError()).toEqual('Signature public key is not trusted')
    })

    it('should succeed with valid signature and encryption key', () => {
      operator.asymmetricDecrypt = jest.fn().mockReturnValue({
        plaintext: '{"foo": "bar"}',
        signatureVerified: true,
        signaturePublicKey: 'signing-public-key',
        senderPublicKey: 'encryption-public-key',
      })

      const senderContact = {
        name: 'Other',
        contactUuid: '456',
        publicKeySet: createMockPublicKeySetChain(),
        isMe: false,
      } as jest.Mocked<TrustedContactInterface>

      senderContact.getTrustStatusForPublicKey = jest.fn().mockReturnValue(PublicKeyTrustStatus.Trusted)
      senderContact.getTrustStatusForSigningPublicKey = jest.fn().mockReturnValue(PublicKeyTrustStatus.Trusted)

      const result = usecase.execute({
        message: 'encrypted',
        sender: senderContact,
        privateKey: 'private-key',
      })

      expect(result.isFailed()).toEqual(false)
      expect(result.getValue()).toEqual({ foo: 'bar' })
    })
  })

  describe('without trusted sender', () => {
    it('should succeed with valid signature and encryption key', () => {
      operator.asymmetricDecrypt = jest.fn().mockReturnValue({
        plaintext: '{"foo": "bar"}',
        signatureVerified: true,
        signaturePublicKey: 'signing-public-key',
        senderPublicKey: 'encryption-public-key',
      })

      const result = usecase.execute({
        message: 'encrypted',
        sender: undefined,
        privateKey: 'private-key',
      })

      expect(result.isFailed()).toEqual(false)
      expect(result.getValue()).toEqual({ foo: 'bar' })
    })
  })
})
