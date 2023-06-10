import { PureCryptoInterface } from '@standardnotes/sncrypto-common'

import { getMockedCrypto } from '../../MockedCrypto'
import { VerifySymmetricPayloadSignatureUseCase } from './VerifySymmetricPayloadSignature'
import { EncryptedParameters } from '@standardnotes/snjs'
import { GenerateSymmetricSigningDataUseCase } from './GenerateSymmetricSigningData'
import { CreateConsistentBase64JsonPayloadUseCase } from '../Utils/CreateConsistentBase64JsonPayload'

describe('generate symmetric signing data usecase', () => {
  let crypto: PureCryptoInterface
  let usecase: VerifySymmetricPayloadSignatureUseCase

  beforeEach(() => {
    crypto = getMockedCrypto()
    usecase = new VerifySymmetricPayloadSignatureUseCase(crypto)
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
    const generateSigningDataUseCase = new GenerateSymmetricSigningDataUseCase(crypto)

    const contentSigningData = generateSigningDataUseCase.execute(content, payloadEncryptionKey, keypair)
    const contentKeySigningData = generateSigningDataUseCase.execute(contentKey, payloadEncryptionKey, keypair)

    const encodeUseCase = new CreateConsistentBase64JsonPayloadUseCase(crypto)

    const result = usecase.execute(
      payload,
      payloadEncryptionKey,
      {
        signingData: encodeUseCase.execute(contentKeySigningData.signingPayload),
        plaintext: contentKey,
      },
      {
        signingData: encodeUseCase.execute(contentSigningData.signingPayload),
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

    const generateSigningDataUseCase = new GenerateSymmetricSigningDataUseCase(crypto)

    const contentSigningData = generateSigningDataUseCase.execute(content, payloadEncryptionKey, undefined)
    const contentKeySigningData = generateSigningDataUseCase.execute(contentKey, payloadEncryptionKey, undefined)

    const encodeUseCase = new CreateConsistentBase64JsonPayloadUseCase(crypto)

    const result = usecase.execute(
      payloadWithOptionalSigning,
      payloadEncryptionKey,
      {
        signingData: encodeUseCase.execute(contentKeySigningData.signingPayload),
        plaintext: contentKey,
      },
      {
        signingData: encodeUseCase.execute(contentSigningData.signingPayload),
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

    const generateSigningDataUseCase = new GenerateSymmetricSigningDataUseCase(crypto)

    const contentSigningData = generateSigningDataUseCase.execute(content, payloadEncryptionKey, undefined)
    const contentKeySigningData = generateSigningDataUseCase.execute(contentKey, payloadEncryptionKey, undefined)

    const encodeUseCase = new CreateConsistentBase64JsonPayloadUseCase(crypto)

    const result = usecase.execute(
      payloadWithRequiredSigning,
      payloadEncryptionKey,
      {
        signingData: encodeUseCase.execute(contentKeySigningData.signingPayload),
        plaintext: contentKey,
      },
      {
        signingData: encodeUseCase.execute(contentSigningData.signingPayload),
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
    const generateSigningDataUseCase = new GenerateSymmetricSigningDataUseCase(crypto)

    const contentSigningData = generateSigningDataUseCase.execute(content, payloadEncryptionKey, contentKeyPair)
    const contentKeySigningData = generateSigningDataUseCase.execute(
      contentKey,
      payloadEncryptionKey,
      contentKeyKeyPair,
    )

    const encodeUseCase = new CreateConsistentBase64JsonPayloadUseCase(crypto)

    const result = usecase.execute(
      payload,
      payloadEncryptionKey,
      {
        signingData: encodeUseCase.execute(contentKeySigningData.signingPayload),
        plaintext: contentKey,
      },
      {
        signingData: encodeUseCase.execute(contentSigningData.signingPayload),
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
