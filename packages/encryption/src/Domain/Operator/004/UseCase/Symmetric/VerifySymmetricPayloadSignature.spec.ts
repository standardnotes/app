import { EncryptedParameters } from './../../../../Types/EncryptedParameters'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'

import { getMockedCrypto } from '../../MockedCrypto'
import { VerifySymmetricPayloadSignatureUseCase } from './VerifySymmetricPayloadSignature'
import { GenerateSymmetricAdditionalDataUseCase } from './GenerateSymmetricAdditionalData'
import { CreateConsistentBase64JsonPayloadUseCase } from '../Utils/CreateConsistentBase64JsonPayload'
import { doesPayloadRequireSigning } from '../../V004AlgorithmHelpers'

describe('generate symmetric signing data usecase', () => {
  let crypto: PureCryptoInterface
  let usecase: VerifySymmetricPayloadSignatureUseCase

  beforeEach(() => {
    crypto = getMockedCrypto()
    usecase = new VerifySymmetricPayloadSignatureUseCase(crypto)
  })

  it('payload with key system identifier or shared vault uuid should require signature', () => {
    const payload: Partial<EncryptedParameters> = {
      key_system_identifier: '123',
    }

    expect(doesPayloadRequireSigning(payload)).toBe(true)

    const payloadTwo: Partial<EncryptedParameters> = {
      shared_vault_uuid: '456',
    }

    expect(doesPayloadRequireSigning(payloadTwo)).toBe(true)
  })

  it('payload without key system identifier or shared vault uuid should not require signature', () => {
    const payload: Partial<EncryptedParameters> = {
      key_system_identifier: undefined,
      shared_vault_uuid: undefined,
    }

    expect(doesPayloadRequireSigning(payload)).toBe(false)
  })

  it('signature should be verified with correct parameters', () => {
    const payload: Partial<EncryptedParameters> = {
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
    const payloadWithOptionalSigning: Partial<EncryptedParameters> = {
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
    const payloadWithRequiredSigning: Partial<EncryptedParameters> = {
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
    const payload: Partial<EncryptedParameters> = {
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
})
