import { PureCryptoInterface } from '@standardnotes/sncrypto-common'

import { getMockedCrypto } from '../../MockedCrypto'
import { GenerateSymmetricAdditionalDataUseCase } from './GenerateSymmetricAdditionalData'

describe('generate symmetric additional data usecase', () => {
  let crypto: PureCryptoInterface
  let usecase: GenerateSymmetricAdditionalDataUseCase

  beforeEach(() => {
    crypto = getMockedCrypto()
    usecase = new GenerateSymmetricAdditionalDataUseCase(crypto)
  })

  it('should generate signing data with signing keypair', () => {
    const payloadPlaintext = 'foo'
    const payloadEncryptionkey = 'secret-123'
    const signingKeyPair = crypto.sodiumCryptoSignSeedKeypair('seedling')

    const { additionalData, plaintextHash } = usecase.execute(payloadPlaintext, payloadEncryptionkey, signingKeyPair)

    expect(additionalData).toEqual({
      signingData: {
        publicKey: signingKeyPair.publicKey,
        signature: crypto.sodiumCryptoSign(plaintextHash, signingKeyPair.privateKey),
      },
    })

    expect(plaintextHash).toEqual(crypto.sodiumCryptoGenericHash(payloadPlaintext, payloadEncryptionkey))
  })

  it('should generate empty signing data without signing keypair', () => {
    const payloadPlaintext = 'foo'
    const payloadEncryptionkey = 'secret-123'

    const { additionalData, plaintextHash } = usecase.execute(payloadPlaintext, payloadEncryptionkey, undefined)

    expect(additionalData).toEqual({})

    expect(plaintextHash).toEqual(crypto.sodiumCryptoGenericHash(payloadPlaintext, payloadEncryptionkey))
  })
})
