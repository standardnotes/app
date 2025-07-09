import { deepFreeze, useBoolean } from '@standardnotes/utils'
import { PayloadSource } from '../Types/PayloadSource'
import { TransferPayload } from '../../TransferPayload/Interfaces/TransferPayload'
import { ItemContent, FillItemContent } from '../../Content/ItemContent'
import { PurePayload } from './PurePayload'
import { SyncResolvedParams, SyncResolvedPayload } from '../../../Runtime/Deltas/Utilities/SyncResolvedPayload'
import { PersistentSignatureData } from '../../../Runtime/Encryption/PersistentSignatureData'
import { ContentType } from '@standardnotes/domain-core'

// Mock the utils functions
jest.mock('@standardnotes/utils', () => ({
  deepFreeze: jest.fn(),
  useBoolean: jest.fn((value, defaultValue) => value !== undefined ? !!value : defaultValue),
}))

// Mock the content type encryption check
jest.mock('../../../Runtime/Encryption/ContentTypeUsesRootKeyEncryption', () => ({
  ContentTypeUsesRootKeyEncryption: jest.fn((contentType: string) => {
    const rootKeyTypes = [
      ContentType.TYPES.RootKey,
      ContentType.TYPES.ItemsKey,
      ContentType.TYPES.EncryptedStorage,
      ContentType.TYPES.TrustedContact,
      ContentType.TYPES.KeySystemRootKey,
    ]
    return rootKeyTypes.includes(contentType)
  }),
}))

class TestPurePayload extends PurePayload<TransferPayload<ItemContent>, ItemContent> {
  copy(override?: Partial<TransferPayload>, source?: PayloadSource): this {
    const newPayload = {
      ...this.ejected(),
      ...override,
    }
    return new TestPurePayload(newPayload, source || this.source) as this
  }

  copyAsSyncResolved(override?: Partial<TransferPayload<ItemContent>> & SyncResolvedParams, source?: PayloadSource): SyncResolvedPayload {
    const newPayload = {
      ...this.ejected(),
      ...override,
    }
    return new TestPurePayload(newPayload, source || this.source) as any
  }
}

describe('PurePayload', () => {
  const mockDeepFreeze = deepFreeze as jest.MockedFunction<typeof deepFreeze>
  const mockUseBoolean = useBoolean as jest.MockedFunction<typeof useBoolean>

  beforeEach(() => {
    jest.clearAllMocks()
    mockDeepFreeze.mockImplementation((obj) => obj)
    mockUseBoolean.mockImplementation((value, defaultValue) => value !== undefined ? !!value : defaultValue)
  })

  const createValidRawPayload = (overrides: Partial<TransferPayload<ItemContent>> = {}): TransferPayload<ItemContent> => ({
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    content_type: ContentType.TYPES.Note,
    content: FillItemContent({}),
    deleted: false,
    updated_at: new Date('2023-01-01T12:00:00Z'),
    created_at: new Date('2023-01-01T10:00:00Z'),
    created_at_timestamp: 1672570800000,
    updated_at_timestamp: 1672578000000,
    ...overrides,
  })

  describe('constructor', () => {
    it('should throw error when uuid is null', () => {
      const rawPayload = createValidRawPayload({ uuid: null as any })
      
      expect(() => new TestPurePayload(rawPayload)).toThrow(
        'Attempting to construct payload with null uuid'
      )
    })

    it('should throw error when uuid is undefined', () => {
      const rawPayload = createValidRawPayload({ uuid: undefined as any })
      
      expect(() => new TestPurePayload(rawPayload)).toThrow(
        'Attempting to construct payload with null uuid'
      )
    })

    it('should throw error when content type uses root key encryption but has key_system_identifier', () => {
      const rawPayload = createValidRawPayload({
        content_type: ContentType.TYPES.RootKey,
        key_system_identifier: 'some-key-system-id'
      })
      
      expect(() => new TestPurePayload(rawPayload)).toThrow(
        'Rootkey-encrypted payload should not have a key system identifier'
      )
    })

    it('should allow key_system_identifier for non-root-key content types', () => {
      const rawPayload = createValidRawPayload({
        content_type: ContentType.TYPES.Note,
        key_system_identifier: 'some-key-system-id'
      })
      
      expect(() => new TestPurePayload(rawPayload)).not.toThrow()
    })

    it('should set all properties correctly from raw payload', () => {
      const rawPayload = createValidRawPayload({
        uuid: 'test-uuid',
        content_type: ContentType.TYPES.Note,
        content: FillItemContent({ references: [] }),
        deleted: true,
        dirty: true,
        duplicate_of: 'original-uuid',
        user_uuid: 'user-uuid',
        key_system_identifier: 'key-system-id',
        shared_vault_uuid: 'vault-uuid',
        last_edited_by_uuid: 'editor-uuid',
        dirtyIndex: 5,
        globalDirtyIndexAtLastSync: 3,
        lastSyncBegan: new Date('2023-01-01T11:00:00Z'),
        lastSyncEnd: new Date('2023-01-01T11:30:00Z'),
      })

      const payload = new TestPurePayload(rawPayload, PayloadSource.LocalDatabaseLoaded)

      expect(payload.uuid).toBe('test-uuid')
      expect(payload.content_type).toBe(ContentType.TYPES.Note)
      expect(payload.content).toEqual(rawPayload.content)
      expect(payload.deleted).toBe(true)
      expect(payload.dirty).toBe(true)
      expect(payload.duplicate_of).toBe('original-uuid')
      expect(payload.user_uuid).toBe('user-uuid')
      expect(payload.key_system_identifier).toBe('key-system-id')
      expect(payload.shared_vault_uuid).toBe('vault-uuid')
      expect(payload.last_edited_by_uuid).toBe('editor-uuid')
      expect(payload.dirtyIndex).toBe(5)
      expect(payload.globalDirtyIndexAtLastSync).toBe(3)
      expect(payload.source).toBe(PayloadSource.LocalDatabaseLoaded)
    })

    it('should use default PayloadSource.Constructor when source is not provided', () => {
      const rawPayload = createValidRawPayload()
      const payload = new TestPurePayload(rawPayload)

      expect(payload.source).toBe(PayloadSource.Constructor)
    })

    it('should call useBoolean for deleted field', () => {
      const rawPayload = createValidRawPayload({ deleted: true })
      mockUseBoolean.mockReturnValue(true)

      const payload = new TestPurePayload(rawPayload)

      expect(mockUseBoolean).toHaveBeenCalledWith(true, false)
      expect(payload.deleted).toBe(true)
    })

    it('should use false as default for deleted when undefined', () => {
      const rawPayload = createValidRawPayload({ deleted: undefined })
      mockUseBoolean.mockReturnValue(false)

      const payload = new TestPurePayload(rawPayload)

      expect(mockUseBoolean).toHaveBeenCalledWith(undefined, false)
      expect(payload.deleted).toBe(false)
    })

    it('should handle optional properties as undefined when not provided', () => {
      const rawPayload = createValidRawPayload()
      const payload = new TestPurePayload(rawPayload)

      expect(payload.user_uuid).toBeUndefined()
      expect(payload.key_system_identifier).toBeUndefined()
      expect(payload.shared_vault_uuid).toBeUndefined()
      expect(payload.last_edited_by_uuid).toBeUndefined()
      expect(payload.dirty).toBeUndefined()
      expect(payload.duplicate_of).toBeUndefined()
      expect(payload.dirtyIndex).toBeUndefined()
      expect(payload.globalDirtyIndexAtLastSync).toBeUndefined()
    })

    it('should schedule deepFreeze to be called', (done) => {
      const rawPayload = createValidRawPayload()
      const payload = new TestPurePayload(rawPayload)

      setTimeout(() => {
        expect(mockDeepFreeze).toHaveBeenCalledWith(payload)
        done()
      }, 10)
    })
  })

  describe('date handling', () => {
    it('should handle valid dates correctly', () => {
      const createdAt = new Date('2023-01-01T10:00:00Z')
      const updatedAt = new Date('2023-01-01T12:00:00Z')
      const rawPayload = createValidRawPayload({
        created_at: createdAt,
        updated_at: updatedAt,
        created_at_timestamp: createdAt.getTime(),
        updated_at_timestamp: updatedAt.getTime(),
      })

      const payload = new TestPurePayload(rawPayload)

      expect(payload.created_at).toEqual(createdAt)
      expect(payload.updated_at).toEqual(updatedAt)
      expect(payload.created_at_timestamp).toBe(createdAt.getTime())
      expect(payload.updated_at_timestamp).toBe(updatedAt.getTime())
    })

    it('should handle negative updated_at dates by resetting to epoch', () => {
      const rawPayload = createValidRawPayload({
        updated_at: new Date(-1000),
        updated_at_timestamp: -1000,
      })

      const payload = new TestPurePayload(rawPayload)

      expect(payload.updated_at).toEqual(new Date(0))
      expect(payload.updated_at_timestamp).toBe(0)
    })

    it('should handle negative created_at dates by using updated_at values', () => {
      const updatedAt = new Date('2023-01-01T12:00:00Z')
      const rawPayload = createValidRawPayload({
        created_at: new Date(-1000),
        created_at_timestamp: -1000,
        updated_at: updatedAt,
        updated_at_timestamp: updatedAt.getTime(),
      })

      const payload = new TestPurePayload(rawPayload)

      expect(payload.created_at).toEqual(updatedAt)
      expect(payload.created_at_timestamp).toBe(updatedAt.getTime())
    })

    it('should use current date for created_at when not provided', () => {
      const rawPayload = createValidRawPayload({
        created_at: undefined as any,
        created_at_timestamp: undefined as any,
      })

      const payload = new TestPurePayload(rawPayload)

      expect(payload.created_at).toBeInstanceOf(Date)
      expect(payload.created_at.getTime()).toBeGreaterThan(0)
    })

    it('should use epoch date for updated_at when not provided', () => {
      const rawPayload = createValidRawPayload({
        updated_at: undefined as any,
        updated_at_timestamp: undefined as any,
      })

      const payload = new TestPurePayload(rawPayload)

      expect(payload.updated_at).toEqual(new Date(0))
      expect(payload.updated_at_timestamp).toBe(0)
    })

    it('should handle sync dates correctly', () => {
      const syncBegan = new Date('2023-01-01T11:00:00Z')
      const syncEnd = new Date('2023-01-01T11:30:00Z')
      const rawPayload = createValidRawPayload({
        lastSyncBegan: syncBegan,
        lastSyncEnd: syncEnd,
      })

      const payload = new TestPurePayload(rawPayload)

      expect(payload.lastSyncBegan).toEqual(syncBegan)
      expect(payload.lastSyncEnd).toEqual(syncEnd)
    })

    it('should handle undefined sync dates', () => {
      const rawPayload = createValidRawPayload({
        lastSyncBegan: undefined,
        lastSyncEnd: undefined,
      })

      const payload = new TestPurePayload(rawPayload)

      expect(payload.lastSyncBegan).toBeUndefined()
      expect(payload.lastSyncEnd).toBeUndefined()
    })
  })

  describe('ejected method', () => {
    it('should return comprehensive TransferPayload', () => {
      const rawPayload = createValidRawPayload({
        uuid: 'test-uuid',
        content_type: ContentType.TYPES.Note,
        content: FillItemContent({ references: [] }),
        deleted: true,
        dirty: true,
        duplicate_of: 'original-uuid',
        user_uuid: 'user-uuid',
        key_system_identifier: 'key-system-id',
        shared_vault_uuid: 'vault-uuid',
        last_edited_by_uuid: 'editor-uuid',
        dirtyIndex: 5,
        globalDirtyIndexAtLastSync: 3,
        lastSyncBegan: new Date('2023-01-01T11:00:00Z'),
        lastSyncEnd: new Date('2023-01-01T11:30:00Z'),
      })

      const payload = new TestPurePayload(rawPayload)
      const ejected = payload.ejected()

      expect(ejected.uuid).toBe('test-uuid')
      expect(ejected.content_type).toBe(ContentType.TYPES.Note)
      expect(ejected.content).toEqual(rawPayload.content)
      expect(ejected.deleted).toBe(true)
      expect(ejected.dirty).toBe(true)
      expect(ejected.duplicate_of).toBe('original-uuid')
      expect(ejected.user_uuid).toBe('user-uuid')
      expect(ejected.key_system_identifier).toBe('key-system-id')
      expect(ejected.shared_vault_uuid).toBe('vault-uuid')
      expect(ejected.last_edited_by_uuid).toBe('editor-uuid')
      expect(ejected.dirtyIndex).toBe(5)
      expect(ejected.globalDirtyIndexAtLastSync).toBe(3)
      expect(ejected.lastSyncBegan).toEqual(new Date('2023-01-01T11:00:00Z'))
      expect(ejected.lastSyncEnd).toEqual(new Date('2023-01-01T11:30:00Z'))
    })

    it('should include undefined values in ejected payload', () => {
      const rawPayload = createValidRawPayload()
      const payload = new TestPurePayload(rawPayload)
      const ejected = payload.ejected()

      expect(ejected.user_uuid).toBeUndefined()
      expect(ejected.key_system_identifier).toBeUndefined()
      expect(ejected.shared_vault_uuid).toBeUndefined()
      expect(ejected.last_edited_by_uuid).toBeUndefined()
      expect(ejected.dirty).toBeUndefined()
      expect(ejected.duplicate_of).toBeUndefined()
      expect(ejected.dirtyIndex).toBeUndefined()
      expect(ejected.globalDirtyIndexAtLastSync).toBeUndefined()
    })
  })

  describe('getters', () => {
    it('should return correct serverUpdatedAt', () => {
      const updatedAt = new Date('2023-01-01T12:00:00Z')
      const rawPayload = createValidRawPayload({ updated_at: updatedAt })
      const payload = new TestPurePayload(rawPayload)

      expect(payload.serverUpdatedAt).toEqual(updatedAt)
    })

    it('should return correct serverUpdatedAtTimestamp', () => {
      const timestamp = 1672578000000
      const rawPayload = createValidRawPayload({ updated_at_timestamp: timestamp })
      const payload = new TestPurePayload(rawPayload)

      expect(payload.serverUpdatedAtTimestamp).toBe(timestamp)
    })
  })

  describe('signature data', () => {
    it('should handle signature data correctly', () => {
      const signatureData: PersistentSignatureData = {
        signature: 'test-signature',
        publicKey: 'test-public-key',
      } as any

      const rawPayload = createValidRawPayload({ signatureData })
      const payload = new TestPurePayload(rawPayload)

      expect(payload.signatureData).toEqual(signatureData)
    })

    it('should handle undefined signature data', () => {
      const rawPayload = createValidRawPayload({ signatureData: undefined })
      const payload = new TestPurePayload(rawPayload)

      expect(payload.signatureData).toBeUndefined()
    })
  })

  describe('error handling', () => {
    it('should include content_type in error message when uuid is null', () => {
      const rawPayload = createValidRawPayload({
        uuid: null as any,
        content_type: ContentType.TYPES.Note,
      })

      expect(() => new TestPurePayload(rawPayload)).toThrow(
        /Content type: Note/
      )
    })
  })

  describe('edge cases', () => {
    it('should handle empty string content', () => {
      const rawPayload = createValidRawPayload({ content: '' })
      const payload = new TestPurePayload(rawPayload)

      expect(payload.content).toBe('')
    })

    it('should handle string content', () => {
      const rawPayload = createValidRawPayload({ content: 'encrypted-content' })
      const payload = new TestPurePayload(rawPayload)

      expect(payload.content).toBe('encrypted-content')
    })

    it('should handle zero timestamps', () => {
      const rawPayload = createValidRawPayload({
        created_at_timestamp: 0,
        updated_at_timestamp: 0,
      })
      const payload = new TestPurePayload(rawPayload)

      expect(payload.created_at_timestamp).toBe(0)
      expect(payload.updated_at_timestamp).toBe(0)
    })

    it('should handle null/undefined nullish coalescing correctly', () => {
      const rawPayload = createValidRawPayload({
        user_uuid: null as any,
        key_system_identifier: null as any,
        shared_vault_uuid: null as any,
        last_edited_by_uuid: null as any,
      })
      const payload = new TestPurePayload(rawPayload)

      expect(payload.user_uuid).toBeUndefined()
      expect(payload.key_system_identifier).toBeUndefined()
      expect(payload.shared_vault_uuid).toBeUndefined()
      expect(payload.last_edited_by_uuid).toBeUndefined()
    })
  })
}) 