import { PureCryptoInterface } from '@standardnotes/sncrypto-common'

export function getMockedCrypto(): PureCryptoInterface {
  const crypto = {} as jest.Mocked<PureCryptoInterface>

  const mockGenerateKeyPair = (seed: string) => {
    const publicKey = `public-key-${seed}`
    const privateKey = `private-key-${seed}`

    return {
      publicKey: `${publicKey}:${privateKey}`,
      privateKey: `${privateKey}:${publicKey}`,
    }
  }

  crypto.base64Encode = jest.fn().mockImplementation((text: string) => {
    return `base64-${text}`
  })

  crypto.base64Decode = jest.fn().mockImplementation((text: string) => {
    return text.split('base64-')[1]
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

  crypto.sodiumCryptoBoxEasyEncrypt = jest.fn().mockImplementation((text: string) => {
    return `<e>${text}<e>`
  })

  crypto.sodiumCryptoBoxEasyDecrypt = jest.fn().mockImplementation((text: string) => {
    return text.split('<e>')[1]
  })

  crypto.sodiumCryptoBoxSeedKeypair = jest.fn().mockImplementation((seed: string) => {
    return mockGenerateKeyPair(seed)
  })

  crypto.sodiumCryptoKdfDeriveFromKey = jest
    .fn()
    .mockImplementation((key: string, subkeyNumber: number, subkeyLength: number, context: string) => {
      return `subkey-${key}-${subkeyNumber}-${subkeyLength}-${context}`
    })

  crypto.sodiumCryptoSign = jest.fn().mockImplementation((message: string, privateKey: string) => {
    const signature = `signature|m=${message}|pk=${privateKey}`
    return signature
  })

  crypto.sodiumCryptoSignSeedKeypair = jest.fn().mockImplementation((seed: string) => {
    return mockGenerateKeyPair(seed)
  })

  crypto.sodiumCryptoSignVerify = jest
    .fn()
    .mockImplementation((message: string, signature: string, publicKey: string) => {
      const keyComponents = publicKey.split(':')
      const privateKeyComponent = keyComponents[1]
      const privateKey = `${privateKeyComponent}:${keyComponents[0]}`
      const computedSignature = crypto.sodiumCryptoSign(message, privateKey)
      return computedSignature === signature
    })

  crypto.sodiumCryptoGenericHash = jest.fn().mockImplementation((message: string, key: string) => {
    return `hash-${message}-${key}`
  })

  return crypto
}
