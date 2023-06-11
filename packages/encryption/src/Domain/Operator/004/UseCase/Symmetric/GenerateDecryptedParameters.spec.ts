import { PkcKeyPair, PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { getMockedCrypto } from '../../MockedCrypto'
import { GenerateDecryptedParametersUseCase } from './GenerateDecryptedParameters'
import { ContentType } from '@standardnotes/common'
import { DecryptedPayloadInterface, ItemsKeyInterface } from '@standardnotes/models'
import { GenerateEncryptedParametersUseCase } from './GenerateEncryptedParameters'

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
      content_type: ContentType.ItemsKey,
    } as jest.Mocked<ItemsKeyInterface>
  })

  const generateEncryptedParameters = (plaintext: string) => {
    const decrypted = {
      uuid: '123',
      content: {
        text: plaintext,
      },
      content_type: ContentType.Note,
    } as unknown as jest.Mocked<DecryptedPayloadInterface>

    const encryptedParametersUsecase = new GenerateEncryptedParametersUseCase(crypto)
    return encryptedParametersUsecase.execute(decrypted, itemsKey, signingKeyPair)
  }

  describe('without signatures', () => {
    it('should generate decrypted parameters', () => {
      const encrypted = generateEncryptedParameters('foo')

      const result = usecase.execute(encrypted, itemsKey)

      expect(result).toEqual({
        uuid: expect.any(String),
        content: expect.any(Object),
        signature: {
          required: false,
        },
      })
    })
  })

  describe('with signatures', () => {
    beforeEach(() => {
      signingKeyPair = crypto.sodiumCryptoSignSeedKeypair('seedling')
    })

    it('should generate decrypted parameters', () => {
      const encrypted = generateEncryptedParameters('foo')

      const result = usecase.execute(encrypted, itemsKey)

      expect(result).toEqual({
        uuid: expect.any(String),
        content: expect.any(Object),
        signature: {
          required: false,
          result: {
            passes: true,
            publicKey: signingKeyPair.publicKey,
          },
        },
      })
    })
  })
})
