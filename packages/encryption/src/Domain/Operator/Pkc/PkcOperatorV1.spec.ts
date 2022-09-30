import { PkcOperatorV1 } from './PkcOperatorV1'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'

describe('operator 004', () => {
  let crypto: PureCryptoInterface
  let operator: PkcOperatorV1

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

    operator = new PkcOperatorV1(crypto)
  })

  it('should generateKeyPair', () => {
    const result = operator.generateKeyPair()

    expect(result).toEqual({ privateKey: 'private-key', publicKey: 'public-key', keyType: 'x25519' })
  })

  it('should encryptText', () => {
    const senderKeypair = operator.generateKeyPair()
    const recipientKeypair = operator.generateKeyPair()

    const plaintext = 'foo'

    const result = operator.encryptText(plaintext, senderKeypair.privateKey, recipientKeypair.publicKey)

    expect(result).toEqual(`${'PkcV1_Asym'}:random-string:<e>foo<e>`)
  })

  it('should encryptText', () => {
    const senderKeypair = operator.generateKeyPair()
    const recipientKeypair = operator.generateKeyPair()
    const plaintext = 'foo'
    const ciphertext = operator.encryptText(plaintext, senderKeypair.privateKey, recipientKeypair.publicKey)
    const decrypted = operator.decryptText(ciphertext, senderKeypair.publicKey, recipientKeypair.privateKey)

    expect(decrypted).toEqual('foo')
  })

  it('should encryptPrivateKey', () => {
    const keypair = operator.generateKeyPair()
    const symmetricKey = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    const encryptedKey = operator.encryptPrivateKey(keypair.privateKey, symmetricKey)

    expect(encryptedKey).toEqual(`${'PkcV1_Sym'}:random-string:<e>${keypair.privateKey}<e>`)
  })

  it('should decryptPrivateKey', () => {
    const keypair = operator.generateKeyPair()
    const symmetricKey = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    const encryptedKey = operator.encryptPrivateKey(keypair.privateKey, symmetricKey)
    const decryptedKey = operator.decryptPrivateKey(encryptedKey, symmetricKey)

    expect(decryptedKey).toEqual(keypair.privateKey)
  })
})
