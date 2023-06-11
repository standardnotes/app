import { GenerateRawClientSigningDataUseCase } from './GenerateRawClientSigningData'
import { GenerateSymmetricAdditionalDataUseCase } from './GenerateSymmetricAdditionalData'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { getMockedCrypto } from '../../MockedCrypto'

describe('generate persistent client signature use case', () => {
  let crypto: PureCryptoInterface
  let usecase: GenerateRawClientSigningDataUseCase
  let additionalDataUsecase: GenerateSymmetricAdditionalDataUseCase

  beforeEach(() => {
    crypto = getMockedCrypto()
    usecase = new GenerateRawClientSigningDataUseCase()
    additionalDataUsecase = new GenerateSymmetricAdditionalDataUseCase(crypto)
  })

  it('should return new client signature if previous signing data is not supplied', () => {
    const payloadPlaintext = 'foobar'
    const payloadEncryptionKey = 'secret-123'
    const signingKeyPair = crypto.sodiumCryptoSignSeedKeypair('seedling')

    const { additionalData, plaintextHash } = additionalDataUsecase.execute(
      payloadPlaintext,
      payloadEncryptionKey,
      signingKeyPair,
    )

    const signignData = additionalData.signingData!

    const result = usecase.execute(signignData, undefined, plaintextHash)
    expect(result).toEqual({
      plaintextHash,
      signature: signignData.signature,
      signerPublicKey: signignData.publicKey,
    })
  })

  it('should return new raw signing data if content hash has changed and previous signing data is supplied', () => {
    const signingKeyPair = crypto.sodiumCryptoSignSeedKeypair('seedling')

    const previousPayloadPlaintext = 'foobar'
    const payloadEncryptionKey = 'secret-123'

    const previousAdditionlDataResult = additionalDataUsecase.execute(
      previousPayloadPlaintext,
      payloadEncryptionKey,
      signingKeyPair,
    )

    const previousRawSigningData = usecase.execute(
      previousAdditionlDataResult.additionalData.signingData!,
      undefined,
      previousAdditionlDataResult.plaintextHash,
    )

    const newPayloadPlaintext = 'foobar2'

    const newAdditionalDataResult = additionalDataUsecase.execute(
      newPayloadPlaintext,
      payloadEncryptionKey,
      signingKeyPair,
    )

    const newRawSigningData = usecase.execute(
      newAdditionalDataResult.additionalData.signingData!,
      previousRawSigningData,
      newAdditionalDataResult.plaintextHash,
    )

    expect(newRawSigningData).not.toEqual(previousRawSigningData)
  })

  it('should return previous raw signing data if content hash has not changed', () => {
    const signingKeyPair = crypto.sodiumCryptoSignSeedKeypair('seedling')

    const previousPayloadPlaintext = 'foobar'
    const payloadEncryptionKey = 'secret-123'

    const previousAdditionlDataResult = additionalDataUsecase.execute(
      previousPayloadPlaintext,
      payloadEncryptionKey,
      signingKeyPair,
    )

    const previousRawSigningData = usecase.execute(
      previousAdditionlDataResult.additionalData.signingData!,
      undefined,
      previousAdditionlDataResult.plaintextHash,
    )

    const newPayloadPlaintext = previousPayloadPlaintext

    const newAdditionalDataResult = additionalDataUsecase.execute(
      newPayloadPlaintext,
      payloadEncryptionKey,
      signingKeyPair,
    )

    const newRawSigningData = usecase.execute(
      newAdditionalDataResult.additionalData.signingData!,
      previousRawSigningData,
      newAdditionalDataResult.plaintextHash,
    )

    expect(newRawSigningData).toEqual(previousRawSigningData)
  })
})
