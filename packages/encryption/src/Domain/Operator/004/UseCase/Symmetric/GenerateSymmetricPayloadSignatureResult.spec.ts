import { EncryptedOutputParameters } from '../../../../Types/EncryptedParameters'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'

import { getMockedCrypto } from '../../MockedCrypto'
import { GenerateSymmetricPayloadSignatureResultUseCase } from './GenerateSymmetricPayloadSignatureResult'
import { GenerateSymmetricAdditionalDataUseCase } from './GenerateSymmetricAdditionalData'
import { CreateConsistentBase64JsonPayloadUseCase } from '../Utils/CreateConsistentBase64JsonPayload'
import { doesPayloadRequireSigning } from '../../V004AlgorithmHelpers'

describe('generate symmetric signing data usecase', () => {
  let crypto: PureCryptoInterface
  let usecase: GenerateSymmetricPayloadSignatureResultUseCase

  beforeEach(() => {
    crypto = getMockedCrypto()
    usecase = new GenerateSymmetricPayloadSignatureResultUseCase(crypto)
  })

  it('payload with shared vault uuid should require signature', () => {
    const payload: Partial<EncryptedOutputParameters> = {
      shared_vault_uuid: '456',
    }

    expect(doesPayloadRequireSigning(payload)).toBe(true)
  })

  it('payload with key system identifier only should not require signature', () => {
    const payload: Partial<EncryptedOutputParameters> = {
      key_system_identifier: '123',
    }

    expect(doesPayloadRequireSigning(payload)).toBe(false)
  })

  it('payload without key system identifier or shared vault uuid should not require signature', () => {
    const payload: Partial<EncryptedOutputParameters> = {
      key_system_identifier: undefined,
      shared_vault_uuid: undefined,
    }

    expect(doesPayloadRequireSigning(payload)).toBe(false)
  })

  it('signature should be verified with correct parameters', () => {
    const payload: Partial<EncryptedOutputParameters> = {
      key_system_identifier: '123',
      shared_vault_uuid: '456',
    }
    const payloadEncryptionKey = 'payloadencryptionkey'
    const content = 'contentplaintext'
    const contentKey = 'contentkeysecret'

    const keypair = crypto.sodiumCryptoSignSeedKeypair('seedling')
    const generateAdditionalDataUseCase = new GenerateSymmetricAdditionalDataUseCase(crypto)

    const contentAdditionalDataResultResult = generateAdditionalDataUseCase.execute(
      content,
      payloadEncryptionKey,
      keypair,
    )
    const contentKeyAdditionalDataResultResult = generateAdditionalDataUseCase.execute(
      contentKey,
      payloadEncryptionKey,
      keypair,
    )

    const encodeUseCase = new CreateConsistentBase64JsonPayloadUseCase(crypto)

    const result = usecase.execute(
      payload,
      payloadEncryptionKey,
      {
        additionalData: encodeUseCase.execute(contentKeyAdditionalDataResultResult.additionalData),
        plaintext: contentKey,
      },
      {
        additionalData: encodeUseCase.execute(contentAdditionalDataResultResult.additionalData),
        plaintext: content,
      },
    )

    expect(result).toEqual({
      required: true,
      result: {
        passes: true,
        publicKey: keypair.publicKey,
      },
    })
  })

  it('should return required false with no result if no signing data is provided and signing is not required', () => {
    const payloadWithOptionalSigning: Partial<EncryptedOutputParameters> = {
      key_system_identifier: undefined,
      shared_vault_uuid: undefined,
    }
    const payloadEncryptionKey = 'payloadencryptionkey'
    const content = 'contentplaintext'
    const contentKey = 'contentkeysecret'

    const generateAdditionalDataUseCase = new GenerateSymmetricAdditionalDataUseCase(crypto)

    const contentAdditionalDataResult = generateAdditionalDataUseCase.execute(content, payloadEncryptionKey, undefined)
    const contentKeyAdditionalDataResult = generateAdditionalDataUseCase.execute(
      contentKey,
      payloadEncryptionKey,
      undefined,
    )

    const encodeUseCase = new CreateConsistentBase64JsonPayloadUseCase(crypto)

    const result = usecase.execute(
      payloadWithOptionalSigning,
      payloadEncryptionKey,
      {
        additionalData: encodeUseCase.execute(contentKeyAdditionalDataResult.additionalData),
        plaintext: contentKey,
      },
      {
        additionalData: encodeUseCase.execute(contentAdditionalDataResult.additionalData),
        plaintext: content,
      },
    )

    expect(result).toEqual({
      required: false,
    })
  })

  it('should return required true with fail result if no signing data is provided and signing is required', () => {
    const payloadWithRequiredSigning: Partial<EncryptedOutputParameters> = {
      key_system_identifier: '123',
      shared_vault_uuid: '456',
    }
    const payloadEncryptionKey = 'payloadencryptionkey'
    const content = 'contentplaintext'
    const contentKey = 'contentkeysecret'

    const generateAdditionalDataUseCase = new GenerateSymmetricAdditionalDataUseCase(crypto)

    const contentAdditionalDataResult = generateAdditionalDataUseCase.execute(content, payloadEncryptionKey, undefined)
    const contentKeyAdditionalDataResult = generateAdditionalDataUseCase.execute(
      contentKey,
      payloadEncryptionKey,
      undefined,
    )

    const encodeUseCase = new CreateConsistentBase64JsonPayloadUseCase(crypto)

    const result = usecase.execute(
      payloadWithRequiredSigning,
      payloadEncryptionKey,
      {
        additionalData: encodeUseCase.execute(contentKeyAdditionalDataResult.additionalData),
        plaintext: contentKey,
      },
      {
        additionalData: encodeUseCase.execute(contentAdditionalDataResult.additionalData),
        plaintext: content,
      },
    )

    expect(result).toEqual({
      required: true,
      result: {
        passes: false,
        publicKey: '',
      },
    })
  })

  it('should fail if content public key differs from contentKey public key', () => {
    const payload: Partial<EncryptedOutputParameters> = {
      key_system_identifier: '123',
      shared_vault_uuid: '456',
    }
    const payloadEncryptionKey = 'payloadencryptionkey'
    const content = 'contentplaintext'
    const contentKey = 'contentkeysecret'

    const contentKeyPair = crypto.sodiumCryptoSignSeedKeypair('contentseed')
    const contentKeyKeyPair = crypto.sodiumCryptoSignSeedKeypair('contentkeyseed')
    const generateAdditionalDataUseCase = new GenerateSymmetricAdditionalDataUseCase(crypto)

    const contentAdditionalDataResult = generateAdditionalDataUseCase.execute(
      content,
      payloadEncryptionKey,
      contentKeyPair,
    )
    const contentKeyAdditionalDataResult = generateAdditionalDataUseCase.execute(
      contentKey,
      payloadEncryptionKey,
      contentKeyKeyPair,
    )

    const encodeUseCase = new CreateConsistentBase64JsonPayloadUseCase(crypto)

    const result = usecase.execute(
      payload,
      payloadEncryptionKey,
      {
        additionalData: encodeUseCase.execute(contentKeyAdditionalDataResult.additionalData),
        plaintext: contentKey,
      },
      {
        additionalData: encodeUseCase.execute(contentAdditionalDataResult.additionalData),
        plaintext: content,
      },
    )

    expect(result).toEqual({
      required: true,
      result: {
        passes: false,
        publicKey: '',
      },
    })
  })

  let additionalDataUsecase: GenerateSymmetricAdditionalDataUseCase
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
