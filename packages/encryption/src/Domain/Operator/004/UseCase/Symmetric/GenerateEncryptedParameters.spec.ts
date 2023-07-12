import { PkcKeyPair, PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { getMockedCrypto } from '../../MockedCrypto'
import { AnyKeyParamsContent, ProtocolVersion } from '@standardnotes/common'
import { GenerateEncryptedParametersUseCase } from './GenerateEncryptedParameters'
import {
  DecryptedPayloadInterface,
  ItemsKeyInterface,
  KeySystemRootKeyInterface,
  RootKeyInterface,
} from '@standardnotes/models'
import { deconstructEncryptedPayloadString } from '../../V004AlgorithmHelpers'
import { ParseConsistentBase64JsonPayloadUseCase } from '../Utils/ParseConsistentBase64JsonPayload'
import { SymmetricItemAdditionalData } from '../../../../Types/EncryptionAdditionalData'
import { ContentType } from '@standardnotes/domain-core'

describe('generate encrypted parameters usecase', () => {
  let crypto: PureCryptoInterface
  let usecase: GenerateEncryptedParametersUseCase

  beforeEach(() => {
    crypto = getMockedCrypto()
    usecase = new GenerateEncryptedParametersUseCase(crypto)
  })

  describe('without signing keypair', () => {
    it('should generate encrypted parameters', () => {
      const decrypted = {
        uuid: '123',
        content: {
          title: 'title',
          text: 'text',
        },
        content_type: ContentType.TYPES.Note,
      } as unknown as jest.Mocked<DecryptedPayloadInterface>

      const itemsKey = {
        uuid: 'items-key-id',
        itemsKey: 'items-key',
        content_type: ContentType.TYPES.ItemsKey,
      } as jest.Mocked<ItemsKeyInterface>

      const result = usecase.execute(decrypted, itemsKey)

      expect(result).toEqual({
        uuid: '123',
        content_type: ContentType.TYPES.Note,
        items_key_id: 'items-key-id',
        content: expect.any(String),
        enc_item_key: expect.any(String),
        version: ProtocolVersion.V004,
        rawSigningDataClientOnly: undefined,
      })
    })

    it('should not include items_key_id if item to encrypt is items key payload', () => {
      const decrypted = {
        uuid: '123',
        content: {
          foo: 'bar',
        },
        content_type: ContentType.TYPES.ItemsKey,
      } as unknown as jest.Mocked<DecryptedPayloadInterface>

      const rootKey = {
        uuid: 'items-key-id',
        itemsKey: 'items-key',
        keyParams: {
          content: {} as jest.Mocked<AnyKeyParamsContent>,
        },
        content_type: ContentType.TYPES.RootKey,
      } as jest.Mocked<RootKeyInterface>

      const result = usecase.execute(decrypted, rootKey)

      expect(result.items_key_id).toBeUndefined()
    })

    it('should not include items_key_id if item to encrypt is key system items key payload', () => {
      const decrypted = {
        uuid: '123',
        content: {
          foo: 'bar',
        },
        content_type: ContentType.TYPES.KeySystemItemsKey,
      } as unknown as jest.Mocked<DecryptedPayloadInterface>

      const rootKey = {
        uuid: 'items-key-id',
        itemsKey: 'items-key',
        content_type: ContentType.TYPES.KeySystemRootKey,
      } as jest.Mocked<KeySystemRootKeyInterface>

      const result = usecase.execute(decrypted, rootKey)

      expect(result.items_key_id).toBeUndefined()
    })
  })

  describe('with signing keypair', () => {
    let signingKeyPair: PkcKeyPair
    let parseBase64Usecase: ParseConsistentBase64JsonPayloadUseCase

    beforeEach(() => {
      signingKeyPair = crypto.sodiumCryptoSignSeedKeypair('seedling')
      parseBase64Usecase = new ParseConsistentBase64JsonPayloadUseCase(crypto)
    })

    it('encrypted string should include additional data', () => {
      const decrypted = {
        uuid: '123',
        content: {
          title: 'title',
          text: 'text',
        },
        content_type: ContentType.TYPES.Note,
      } as unknown as jest.Mocked<DecryptedPayloadInterface>

      const itemsKey = {
        uuid: 'items-key-id',
        itemsKey: 'items-key',
        content_type: ContentType.TYPES.ItemsKey,
      } as jest.Mocked<ItemsKeyInterface>

      const result = usecase.execute(decrypted, itemsKey, signingKeyPair)

      const contentComponents = deconstructEncryptedPayloadString(result.content)

      const additionalData = parseBase64Usecase.execute<SymmetricItemAdditionalData>(contentComponents.additionalData)

      expect(additionalData).toEqual({
        signingData: {
          signature: expect.any(String),
          publicKey: signingKeyPair.publicKey,
        },
      })
    })
  })
})
