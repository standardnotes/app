import { ItemsEncryptionService } from './ItemsEncryption'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { PayloadManagerInterface } from '../Payloads/PayloadManagerInterface'
import { StorageServiceInterface } from '../Storage/StorageServiceInterface'
import {
  DecryptedParameters,
  EncryptionOperatorsInterface,
  KeySystemItemsKey,
  StandardException,
} from '@standardnotes/encryption'
import { KeySystemKeyManagerInterface } from '../KeySystem/KeySystemKeyManagerInterface'
import { FindDefaultItemsKey } from './../Encryption/UseCase/ItemsKey/FindDefaultItemsKey'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { EncryptedOutputParameters } from '@standardnotes/encryption'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import {
  DecryptedPayloadInterface,
  EncryptedPayloadInterface,
  ItemsKeyInterface,
  KeySystemItemsKeyInterface,
} from '@standardnotes/models'

describe('ItemsEncryptionService', () => {
  let itemsEncryptionService: ItemsEncryptionService
  let mockItems: jest.Mocked<ItemManagerInterface>
  let mockPayloads: jest.Mocked<PayloadManagerInterface>
  let mockStorage: jest.Mocked<StorageServiceInterface>
  let mockOperators: jest.Mocked<EncryptionOperatorsInterface>
  let mockKeys: jest.Mocked<KeySystemKeyManagerInterface>
  let mockFindDefaultItemsKey: jest.Mocked<FindDefaultItemsKey>
  let mockInternalEventBus: jest.Mocked<InternalEventBusInterface>

  beforeEach(() => {
    mockItems = {
      addObserver: jest.fn(),
    } as unknown as jest.Mocked<ItemManagerInterface>
    mockPayloads = {} as jest.Mocked<PayloadManagerInterface>
    mockStorage = {} as jest.Mocked<StorageServiceInterface>
    mockOperators = {} as jest.Mocked<EncryptionOperatorsInterface>
    mockKeys = {} as jest.Mocked<KeySystemKeyManagerInterface>
    mockFindDefaultItemsKey = {} as jest.Mocked<FindDefaultItemsKey>
    mockInternalEventBus = {} as jest.Mocked<InternalEventBusInterface>

    itemsEncryptionService = new ItemsEncryptionService(
      mockItems,
      mockPayloads,
      mockStorage,
      mockOperators,
      mockKeys,
      mockFindDefaultItemsKey,
      mockInternalEventBus,
    )
  })

  describe('decryptPayloadWithKeyLookup', () => {
    it('returns decrypted parameters when a key is found', async () => {
      const mockPayload = {
        uuid: 'payload-uuid',
      } as EncryptedPayloadInterface

      const mockKey = {
        uuid: 'key-uuid',
      } as KeySystemItemsKey

      const mockDecryptedParameters = {
        uuid: 'decrypted-uuid',
        content: {},
      } as DecryptedParameters

      itemsEncryptionService.keyToUseForDecryptionOfPayload = jest.fn().mockReturnValue(mockKey)

      itemsEncryptionService.decryptPayload = jest.fn().mockResolvedValue(mockDecryptedParameters)

      const result = await itemsEncryptionService.decryptPayloadWithKeyLookup(mockPayload)

      expect(itemsEncryptionService.keyToUseForDecryptionOfPayload).toHaveBeenCalledWith(mockPayload)
      expect(itemsEncryptionService.decryptPayload).toHaveBeenCalledWith(mockPayload, mockKey)
      expect(result).toEqual(mockDecryptedParameters)
    })

    it('returns error parameters when no key is found', async () => {
      const mockPayload = {
        uuid: 'payload-uuid',
      } as EncryptedPayloadInterface

      itemsEncryptionService.keyToUseForDecryptionOfPayload = jest.fn().mockReturnValue(undefined)

      const result = await itemsEncryptionService.decryptPayloadWithKeyLookup(mockPayload)

      expect(itemsEncryptionService.keyToUseForDecryptionOfPayload).toHaveBeenCalledWith(mockPayload)
      expect(result).toEqual({
        uuid: mockPayload.uuid,
        errorDecrypting: true,
        waitingForKey: true,
      })
    })
  })

  describe('keyToUseForDecryptionOfPayload', () => {
    it('returns itemsKey when payload has items_key_id', () => {
      const mockPayload: EncryptedPayloadInterface = {
        items_key_id: 'test-key-id',
      } as EncryptedPayloadInterface

      const mockItemsKey: ItemsKeyInterface = {} as ItemsKeyInterface
      itemsEncryptionService.itemsKeyForEncryptedPayload = jest.fn().mockReturnValue(mockItemsKey)

      const result = itemsEncryptionService.keyToUseForDecryptionOfPayload(mockPayload)

      expect(itemsEncryptionService.itemsKeyForEncryptedPayload).toHaveBeenCalledWith(mockPayload)
      expect(result).toBe(mockItemsKey)
    })

    it('returns defaultKey when payload does not have items_key_id', () => {
      const mockPayload: EncryptedPayloadInterface = {} as EncryptedPayloadInterface
      const mockDefaultKey: KeySystemItemsKeyInterface = {} as KeySystemItemsKeyInterface

      itemsEncryptionService.defaultItemsKeyForItemVersion = jest.fn().mockReturnValue(mockDefaultKey)

      const result = itemsEncryptionService.keyToUseForDecryptionOfPayload(mockPayload)

      expect(itemsEncryptionService.defaultItemsKeyForItemVersion).toHaveBeenCalledWith(mockPayload.version)
      expect(result).toBe(mockDefaultKey)
    })
  })

  describe('encryptPayloadWithKeyLookup', () => {
    it('throws an error when keyToUseForItemEncryption returns an instance of StandardException', async () => {
      const mockPayload: DecryptedPayloadInterface = {} as DecryptedPayloadInterface
      const mockError: StandardException = new StandardException('test-error')

      itemsEncryptionService.keyToUseForItemEncryption = jest.fn().mockReturnValue(mockError)

      await expect(() => itemsEncryptionService.encryptPayloadWithKeyLookup(mockPayload)).rejects.toThrow('test-error')
    })

    it('encrypts the payload using the provided key', async () => {
      const mockPayload: DecryptedPayloadInterface = {} as DecryptedPayloadInterface
      const mockKey: ItemsKeyInterface = {} as ItemsKeyInterface
      const encryptedOutputParameters: EncryptedOutputParameters = {
        content: 'encrypted-content',
      } as EncryptedOutputParameters

      itemsEncryptionService.keyToUseForItemEncryption = jest.fn().mockReturnValue(mockKey)
      itemsEncryptionService.encryptPayload = jest.fn().mockResolvedValue(encryptedOutputParameters)

      const result = await itemsEncryptionService.encryptPayloadWithKeyLookup(mockPayload)

      expect(itemsEncryptionService.encryptPayload).toHaveBeenCalledWith(mockPayload, mockKey, undefined)
      expect(result).toBe(encryptedOutputParameters)
    })
  })

  describe('encryptPayload', () => {
    it('throws an error when the payload has no content', async () => {
      const mockPayload: DecryptedPayloadInterface = { content: null } as unknown as DecryptedPayloadInterface
      const mockKey: ItemsKeyInterface = {} as ItemsKeyInterface

      await expect(() => itemsEncryptionService.encryptPayload(mockPayload, mockKey)).rejects.toThrow(
        'Attempting to encrypt payload with no content.',
      )
    })

    it('throws an error when the payload has no UUID', async () => {
      const mockPayload: DecryptedPayloadInterface = { uuid: null, content: {} } as unknown as DecryptedPayloadInterface
      const mockKey: ItemsKeyInterface = {} as ItemsKeyInterface

      await expect(() => itemsEncryptionService.encryptPayload(mockPayload, mockKey)).rejects.toThrow(
        'Attempting to encrypt payload with no UuidGenerator.',
      )
    })

    it('returns encrypted output parameters', async () => {
      const mockPayload: DecryptedPayloadInterface = {
        uuid: 'test-uuid',
        content: 'test-content',
      } as unknown as DecryptedPayloadInterface
      const mockKey: ItemsKeyInterface = {} as ItemsKeyInterface
      const encryptedOutputParameters: EncryptedOutputParameters = {
        content: 'encrypted-content',
      } as EncryptedOutputParameters

      jest.spyOn(itemsEncryptionService, 'encryptPayload').mockResolvedValue(encryptedOutputParameters)

      const result = await itemsEncryptionService.encryptPayload(mockPayload, mockKey)

      expect(result).toBe(encryptedOutputParameters)
    })
  })

  it('repersistAllItems', async () => {
    Object.defineProperty(mockItems, 'items', {
      get: jest.fn().mockReturnValue([{ payload: { uuid: '123' } }]),
    })

    mockStorage.savePayloads = jest.fn().mockResolvedValue(undefined)

    await itemsEncryptionService.repersistAllItems()

    expect(mockStorage.savePayloads).toHaveBeenCalledWith([{ uuid: '123' }])
  })

  it('encryptPayloadWithKeyLookup', async () => {
    const mockPayload: DecryptedPayloadInterface = {
      key_system_identifier: 'test-identifier',
    } as DecryptedPayloadInterface

    const mockKeyPair: PkcKeyPair = { publicKey: 'publicKey', privateKey: 'privateKey' }
    const mockKey = { uuid: 'key-id', keyVersion: '004' } as KeySystemItemsKey

    mockKeys.getPrimaryKeySystemItemsKey = jest.fn().mockReturnValue(mockKey)
    itemsEncryptionService.encryptPayload = jest
      .fn()
      .mockResolvedValue({ content: '004:...' } as EncryptedOutputParameters)

    const result = await itemsEncryptionService.encryptPayloadWithKeyLookup(mockPayload, mockKeyPair)

    expect(mockKeys.getPrimaryKeySystemItemsKey).toHaveBeenCalledWith(mockPayload.key_system_identifier)
    expect(itemsEncryptionService.encryptPayload).toHaveBeenCalledWith(mockPayload, mockKey, mockKeyPair)
    expect(result).toEqual({ content: '004:...' })
  })
})
