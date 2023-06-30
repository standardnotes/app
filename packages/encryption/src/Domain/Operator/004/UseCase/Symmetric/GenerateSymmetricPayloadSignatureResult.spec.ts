import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { getMockedCrypto } from '../../MockedCrypto'
import { EncryptedInputParameters, EncryptedOutputParameters } from '../../../../Types/EncryptedParameters'
import { GenerateSymmetricPayloadSignatureResultUseCase } from './GenerateSymmetricPayloadSignatureResult'
import { GenerateSymmetricAdditionalDataUseCase } from './GenerateSymmetricAdditionalData'
import { CreateConsistentBase64JsonPayloadUseCase } from '../Utils/CreateConsistentBase64JsonPayload'
import { doesPayloadRequireSigning } from '../../V004AlgorithmHelpers'
import { PersistentSignatureData } from '@standardnotes/models'
import { HashStringUseCase } from '../Hash/HashString'
import { HashingKey } from '../Hash/HashingKey'

describe('generate symmetric signing data usecase', () => {
  let crypto: PureCryptoInterface
  let usecase: GenerateSymmetricPayloadSignatureResultUseCase
  let hashUsecase: HashStringUseCase
  let additionalDataUseCase: GenerateSymmetricAdditionalDataUseCase
  let encodeUseCase: CreateConsistentBase64JsonPayloadUseCase

  beforeEach(() => {
    crypto = getMockedCrypto()
    usecase = new GenerateSymmetricPayloadSignatureResultUseCase(crypto)
    hashUsecase = new HashStringUseCase(crypto)
    additionalDataUseCase = new GenerateSymmetricAdditionalDataUseCase(crypto)
    encodeUseCase = new CreateConsistentBase64JsonPayloadUseCase(crypto)
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
    const payload = {
      key_system_identifier: '123',
      shared_vault_uuid: '456',
    } as jest.Mocked<EncryptedInputParameters>

    const hashingKey: HashingKey = { key: 'secret-123' }
    const content = 'contentplaintext'
    const contentKey = 'contentkeysecret'

    const keypair = crypto.sodiumCryptoSignSeedKeypair('seedling')

    const contentAdditionalDataResultResult = additionalDataUseCase.execute(content, hashingKey, keypair)

    const contentKeyAdditionalDataResultResult = additionalDataUseCase.execute(contentKey, hashingKey, keypair)

    const result = usecase.execute(
      payload,
      hashingKey,
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
      contentHash: expect.any(String),
      result: {
        passes: true,
        publicKey: keypair.publicKey,
        signature: expect.any(String),
      },
    })
  })

  it('should return required false with no result if no signing data is provided and signing is not required', () => {
    const payloadWithOptionalSigning = {
      key_system_identifier: undefined,
      shared_vault_uuid: undefined,
    } as jest.Mocked<EncryptedInputParameters>

    const hashingKey: HashingKey = { key: 'secret-123' }
    const content = 'contentplaintext'
    const contentKey = 'contentkeysecret'

    const contentAdditionalDataResult = additionalDataUseCase.execute(content, hashingKey, undefined)
    const contentKeyAdditionalDataResult = additionalDataUseCase.execute(contentKey, hashingKey, undefined)

    const result = usecase.execute(
      payloadWithOptionalSigning,
      hashingKey,
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
      contentHash: expect.any(String),
    })
  })

  it('should return required true with fail result if no signing data is provided and signing is required', () => {
    const payloadWithRequiredSigning = {
      key_system_identifier: '123',
      shared_vault_uuid: '456',
    } as jest.Mocked<EncryptedInputParameters>

    const hashingKey: HashingKey = { key: 'secret-123' }
    const content = 'contentplaintext'
    const contentKey = 'contentkeysecret'

    const contentAdditionalDataResult = additionalDataUseCase.execute(content, hashingKey, undefined)
    const contentKeyAdditionalDataResult = additionalDataUseCase.execute(contentKey, hashingKey, undefined)

    const result = usecase.execute(
      payloadWithRequiredSigning,
      hashingKey,
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
      contentHash: expect.any(String),
      result: {
        passes: false,
        publicKey: '',
        signature: '',
      },
    })
  })

  it('should fail if content public key differs from contentKey public key', () => {
    const payload = {
      key_system_identifier: '123',
      shared_vault_uuid: '456',
    } as jest.Mocked<EncryptedInputParameters>

    const hashingKey: HashingKey = { key: 'secret-123' }
    const content = 'contentplaintext'
    const contentKey = 'contentkeysecret'

    const contentKeyPair = crypto.sodiumCryptoSignSeedKeypair('contentseed')
    const contentKeyKeyPair = crypto.sodiumCryptoSignSeedKeypair('contentkeyseed')

    const contentAdditionalDataResult = additionalDataUseCase.execute(content, hashingKey, contentKeyPair)
    const contentKeyAdditionalDataResult = additionalDataUseCase.execute(contentKey, hashingKey, contentKeyKeyPair)

    const result = usecase.execute(
      payload,
      hashingKey,
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
      contentHash: expect.any(String),
      result: {
        passes: false,
        publicKey: '',
        signature: '',
      },
    })
  })

  it('if content hash has not changed and previous failing signature is supplied, new result should also be failing', () => {
    const hashingKey: HashingKey = { key: 'secret-123' }
    const content = 'contentplaintext'
    const contentKey = 'contentkeysecret'
    const contentHash = hashUsecase.execute(content, hashingKey)

    const previousResult: PersistentSignatureData = {
      required: true,
      contentHash: contentHash,
      result: {
        passes: false,
        publicKey: '',
        signature: '',
      },
    }

    const payload = {
      key_system_identifier: '123',
      shared_vault_uuid: '456',
      signatureData: previousResult,
    } as jest.Mocked<EncryptedInputParameters>

    const keypair = crypto.sodiumCryptoSignSeedKeypair('seedling')

    const contentAdditionalDataResultResult = additionalDataUseCase.execute(content, hashingKey, keypair)

    const contentKeyAdditionalDataResultResult = additionalDataUseCase.execute(contentKey, hashingKey, keypair)

    const result = usecase.execute(
      payload,
      hashingKey,
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
      contentHash: contentHash,
      result: {
        passes: false,
        publicKey: keypair.publicKey,
        signature: expect.any(String),
      },
    })
  })

  it('previous failing signature should be ignored if content hash has changed', () => {
    const hashingKey: HashingKey = { key: 'secret-123' }
    const content = 'contentplaintext'
    const contentKey = 'contentkeysecret'

    const previousResult: PersistentSignatureData = {
      required: true,
      contentHash: 'different hash',
      result: {
        passes: false,
        publicKey: '',
        signature: '',
      },
    }

    const payload = {
      key_system_identifier: '123',
      shared_vault_uuid: '456',
      signatureData: previousResult,
    } as jest.Mocked<EncryptedInputParameters>

    const keypair = crypto.sodiumCryptoSignSeedKeypair('seedling')

    const contentAdditionalDataResultResult = additionalDataUseCase.execute(content, hashingKey, keypair)

    const contentKeyAdditionalDataResultResult = additionalDataUseCase.execute(contentKey, hashingKey, keypair)

    const result = usecase.execute(
      payload,
      hashingKey,
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
      contentHash: expect.any(String),
      result: {
        passes: true,
        publicKey: keypair.publicKey,
        signature: expect.any(String),
      },
    })
  })
})
