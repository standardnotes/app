import { PureCryptoInterface } from '@standardnotes/sncrypto-common'

import { getMockedCrypto } from '../../MockedCrypto'
import { GenerateSymmetricSigningDataUseCase } from './GenerateSymmetricSigningData'

describe('generate symmetric signing data usecase', () => {
  let crypto: PureCryptoInterface
  let usecase: GenerateSymmetricSigningDataUseCase

  beforeEach(() => {
    crypto = getMockedCrypto()
    usecase = new GenerateSymmetricSigningDataUseCase(crypto)
  })

  it('should generate signing data with signing keypair', () => {
    const payloadPlaintext = 'foo'
    const payloadEncryptionkey = 'secret-123'
    const signingKeyPair = crypto.sodiumCryptoSignSeedKeypair('seedling')

    const result = usecase.execute(payloadPlaintext, payloadEncryptionkey, signingKeyPair)

    const plaintextHash = crypto.sodiumCryptoGenericHash(payloadPlaintext, payloadEncryptionkey)

    expect(result).toEqual({
      signingPayload: {
        data: {
          publicKey: signingKeyPair.publicKey,
          signature: crypto.sodiumCryptoSign(plaintextHash, signingKeyPair.privateKey),
        },
      },
      plaintextHash,
    })
  })

  it('should generate empty signing data without signing keypair', () => {
    const payloadPlaintext = 'foo'
    const payloadEncryptionkey = 'secret-123'

    const result = usecase.execute(payloadPlaintext, payloadEncryptionkey, undefined)

    const plaintextHash = crypto.sodiumCryptoGenericHash(payloadPlaintext, payloadEncryptionkey)

    expect(result).toEqual({
      signingPayload: {},
      plaintextHash,
    })
  })
})
