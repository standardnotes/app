import { PkcKeyPair, PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { getMockedCrypto } from '../../MockedCrypto'
import { GenerateDecryptedParametersUseCase } from './GenerateDecryptedParameters'
import { DecryptedPayloadInterface, ItemsKeyInterface } from '@standardnotes/models'
import { GenerateEncryptedParametersUseCase } from './GenerateEncryptedParameters'
import { EncryptedInputParameters, EncryptedOutputParameters } from '../../../../Types/EncryptedParameters'
import { ContentType } from '@standardnotes/domain-core'

describe('generate decrypted parameters usecase', () => {
  let crypto: PureCryptoInterface
  let usecase: GenerateDecryptedParametersUseCase
  let signingKeyPair: PkcKeyPair
  let itemsKey: ItemsKeyInterface

  beforeEach(() => {
    crypto = getMockedCrypto()
    usecase = new GenerateDecryptedParametersUseCase(crypto)
    itemsKey = {
      uuid: 'items-key-id',
      itemsKey: 'items-key',
      content_type: ContentType.TYPES.ItemsKey,
    } as jest.Mocked<ItemsKeyInterface>
  })

  const generateEncryptedParameters = <T extends EncryptedOutputParameters>(plaintext: string) => {
    const decrypted = {
      uuid: '123',
      content: {
        text: plaintext,
      },
      content_type: ContentType.TYPES.Note,
    } as unknown as jest.Mocked<DecryptedPayloadInterface>

    const encryptedParametersUsecase = new GenerateEncryptedParametersUseCase(crypto)
    return encryptedParametersUsecase.execute(decrypted, itemsKey, signingKeyPair) as T
  }

  describe('without signatures', () => {
    it('should generate decrypted parameters', () => {
      const encrypted = generateEncryptedParameters<EncryptedInputParameters>('foo')

      const result = usecase.execute(encrypted, itemsKey)

      expect(result).toEqual({
        uuid: expect.any(String),
        content: expect.any(Object),
        signatureData: {
          required: false,
          contentHash: expect.any(String),
        },
      })
    })
  })

  describe('with signatures', () => {
    beforeEach(() => {
      signingKeyPair = crypto.sodiumCryptoSignSeedKeypair('seedling')
    })

    it('should generate decrypted parameters', () => {
      const encrypted = generateEncryptedParameters<EncryptedInputParameters>('foo')

      const result = usecase.execute(encrypted, itemsKey)

      expect(result).toEqual({
        uuid: expect.any(String),
        content: expect.any(Object),
        signatureData: {
          required: false,
          contentHash: expect.any(String),
          result: {
            passes: true,
            publicKey: signingKeyPair.publicKey,
            signature: expect.any(String),
          },
        },
      })
    })
  })
})
