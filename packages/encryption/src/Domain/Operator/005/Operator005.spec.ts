import { ProtocolOperator005 } from './Operator005'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'

describe('operator 005', () => {
  let crypto: PureCryptoInterface
  let operator: ProtocolOperator005

  beforeEach(() => {
    crypto = {} as jest.Mocked<PureCryptoInterface>
    crypto.generateRandomKey = jest.fn().mockImplementation(() => {
      return 'random-string'
    })
    crypto.xchacha20Encrypt = jest.fn().mockImplementation((text: string) => {
      return `<e>${text}<e>`
    })
    crypto.xchacha20Decrypt = jest.fn().mockImplementation((text: string) => {
      return text.split('<e>')[1]
    })
    crypto.sodiumCryptoBoxGenerateKeypair = jest.fn().mockImplementation(() => {
      return { privateKey: 'private-key', publicKey: 'public-key', keyType: 'x25519' }
    })
    crypto.sodiumCryptoBoxEasyEncrypt = jest.fn().mockImplementation((text: string) => {
      return `<e>${text}<e>`
    })
    crypto.sodiumCryptoBoxEasyDecrypt = jest.fn().mockImplementation((text: string) => {
      return text.split('<e>')[1]
    })

    operator = new ProtocolOperator005(crypto)
  })

  it('should generateKeyPair', () => {
    const result = operator.generateKeyPair()

    expect(result).toEqual({ privateKey: 'private-key', publicKey: 'public-key', keyType: 'x25519' })
  })

  it('should asymmetricEncryptKey', () => {
    const senderKeypair = operator.generateKeyPair()
    const recipientKeypair = operator.generateKeyPair()

    const plaintext = 'foo'

    const result = operator.asymmetricEncryptKey(plaintext, senderKeypair.privateKey, recipientKeypair.publicKey)

    expect(result).toEqual(`${'005_KeyAsym'}:random-string:<e>foo<e>`)
  })

  it('should asymmetricDecryptKey', () => {
    const senderKeypair = operator.generateKeyPair()
    const recipientKeypair = operator.generateKeyPair()
    const plaintext = 'foo'
    const ciphertext = operator.asymmetricEncryptKey(plaintext, senderKeypair.privateKey, recipientKeypair.publicKey)
    const decrypted = operator.asymmetricDecryptKey(ciphertext, senderKeypair.publicKey, recipientKeypair.privateKey)

    expect(decrypted).toEqual('foo')
  })

  it('should symmetricEncryptPrivateKey', () => {
    const keypair = operator.generateKeyPair()
    const symmetricKey = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    const encryptedKey = operator.symmetricEncryptPrivateKey(keypair.privateKey, symmetricKey)

    expect(encryptedKey).toEqual(`${'005_KeySym'}:random-string:<e>${keypair.privateKey}<e>`)
  })

  it('should symmetricDecryptPrivateKey', () => {
    const keypair = operator.generateKeyPair()
    const symmetricKey = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    const encryptedKey = operator.symmetricEncryptPrivateKey(keypair.privateKey, symmetricKey)
    const decryptedKey = operator.symmetricDecryptPrivateKey(encryptedKey, symmetricKey)

    expect(decryptedKey).toEqual(keypair.privateKey)
  })
})
