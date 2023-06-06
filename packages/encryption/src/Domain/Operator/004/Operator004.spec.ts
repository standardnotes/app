import { ContentType, ProtocolVersion } from '@standardnotes/common'
import { DecryptedPayload, ItemContent, ItemsKeyContent, PayloadTimestampDefaults } from '@standardnotes/models'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { SNItemsKey } from '../../Keys/ItemsKey/ItemsKey'
import { ItemAuthenticatedData } from '../../Types/ItemAuthenticatedData'
import { SNProtocolOperator004 } from './Operator004'

const b64 = (text: string): string => {
  return Buffer.from(text).toString('base64')
}

describe('operator 004', () => {
  let crypto: PureCryptoInterface
  let operator: SNProtocolOperator004

  beforeEach(() => {
    crypto = {} as jest.Mocked<PureCryptoInterface>
    crypto.base64Encode = jest.fn().mockImplementation((text: string) => {
      return b64(text)
    })
    crypto.base64Decode = jest.fn().mockImplementation((text: string) => {
      return Buffer.from(text, 'base64').toString('ascii')
    })
    crypto.xchacha20Encrypt = jest.fn().mockImplementation((text: string) => {
      return `<e>${text}<e>`
    })
    crypto.xchacha20Decrypt = jest.fn().mockImplementation((text: string) => {
      return text.split('<e>')[1]
    })
    crypto.generateRandomKey = jest.fn().mockImplementation(() => {
      return 'random-string'
    })
    crypto.sodiumCryptoBoxGenerateKeyPair = jest.fn().mockImplementation(() => {
      return { privateKey: 'private-key', publicKey: 'public-key', keyType: 'x25519' }
    })
    crypto.sodiumCryptoBoxEasyEncrypt = jest.fn().mockImplementation((text: string) => {
      return `<e>${text}<e>`
    })
    crypto.sodiumCryptoBoxEasyDecrypt = jest.fn().mockImplementation((text: string) => {
      return text.split('<e>')[1]
    })

    operator = new SNProtocolOperator004(crypto)
  })

  it('should generateEncryptedProtocolString', () => {
    const aad: ItemAuthenticatedData = {
      u: '123',
      v: ProtocolVersion.V004,
    }

    const nonce = 'noncy'
    const plaintext = 'foo'

    operator.generateEncryptionNonce = jest.fn().mockReturnValue(nonce)

    const result = operator.generateEncryptedProtocolString(plaintext, 'secret', aad)

    expect(result).toEqual(`004:${nonce}:<e>${plaintext}<e>:${b64(JSON.stringify(aad))}`)
  })

  it('should deconstructEncryptedPayloadString', () => {
    const string = '004:noncy:<e>foo<e>:eyJ1IjoiMTIzIiwidiI6IjAwNCJ9'

    const result = operator.deconstructEncryptedPayloadString(string)

    expect(result).toEqual({
      version: '004',
      nonce: 'noncy',
      ciphertext: '<e>foo<e>',
      authenticatedData: 'eyJ1IjoiMTIzIiwidiI6IjAwNCJ9',
    })
  })

  it('should generateEncryptedParametersSync', () => {
    const payload = {
      uuid: '123',
      content_type: ContentType.Note,
      content: { foo: 'bar' } as unknown as jest.Mocked<ItemContent>,
      ...PayloadTimestampDefaults(),
    } as jest.Mocked<DecryptedPayload>

    const key = new SNItemsKey(
      new DecryptedPayload<ItemsKeyContent>({
        uuid: 'key-456',
        content_type: ContentType.ItemsKey,
        content: {
          itemsKey: 'secret',
          version: ProtocolVersion.V004,
        } as jest.Mocked<ItemsKeyContent>,
        ...PayloadTimestampDefaults(),
      }),
    )

    const result = operator.generateEncryptedParametersSync(payload, key)

    expect(result).toEqual({
      uuid: '123',
      items_key_id: 'key-456',
      content: '004:random-string:<e>{"foo":"bar"}<e>:eyJ1IjoiMTIzIiwidiI6IjAwNCJ9',
      enc_item_key: '004:random-string:<e>random-string<e>:eyJ1IjoiMTIzIiwidiI6IjAwNCJ9',
      version: '004',
    })
  })

  it('should generateKeyPair', () => {
    const result = operator.generateKeyPair()

    expect(result).toEqual({ privateKey: 'private-key', publicKey: 'public-key', keyType: 'x25519' })
  })

  it('should asymmetricEncrypt', () => {
    const senderKeyPair = operator.generateKeyPair()
    const recipientKeyPair = operator.generateKeyPair()

    const plaintext = 'foo'

    const result = operator.asymmetricEncrypt(plaintext, senderKeyPair.privateKey, recipientKeyPair.publicKey)

    expect(result).toEqual(`${'005_KeyAsym'}:random-string:<e>foo<e>`)
  })

  it('should asymmetricDecrypt', () => {
    const senderKeyPair = operator.generateKeyPair()
    const recipientKeyPair = operator.generateKeyPair()
    const plaintext = 'foo'
    const ciphertext = operator.asymmetricEncrypt(plaintext, senderKeyPair.privateKey, recipientKeyPair.publicKey)
    const decrypted = operator.asymmetricDecrypt(ciphertext, senderKeyPair.publicKey, recipientKeyPair.privateKey)

    expect(decrypted).toEqual('foo')
  })

  it('should symmetricEncrypt', () => {
    const keypair = operator.generateKeyPair()
    const symmetricKey = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    const encryptedKey = operator.symmetricEncrypt(keypair.privateKey, symmetricKey)

    expect(encryptedKey).toEqual(`${'005_KeySym'}:random-string:<e>${keypair.privateKey}<e>`)
  })

  it('should symmetricDecrypt', () => {
    const keypair = operator.generateKeyPair()
    const symmetricKey = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    const encryptedKey = operator.symmetricEncrypt(keypair.privateKey, symmetricKey)
    const decryptedKey = operator.symmetricDecrypt(encryptedKey, symmetricKey)

    expect(decryptedKey).toEqual(keypair.privateKey)
  })
})
