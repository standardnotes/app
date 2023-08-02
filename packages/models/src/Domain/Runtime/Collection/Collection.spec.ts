import {
  Collection,
  DecryptedCollectionElement,
  DeletedCollectionElement,
  EncryptedCollectionElement,
} from './Collection'
import { FullyFormedPayloadInterface } from '../../Abstract/Payload'

class TestCollection<P extends FullyFormedPayloadInterface = FullyFormedPayloadInterface> extends Collection<
  P,
  DecryptedCollectionElement,
  EncryptedCollectionElement,
  DeletedCollectionElement
> {}

describe('Collection', () => {
  let collection: TestCollection

  beforeEach(() => {
    collection = new TestCollection()
  })

  it('should initialize correctly', () => {
    expect(collection.map).toEqual({})
    expect(collection.typedMap).toEqual({})
    expect(collection.referenceMap).toBeDefined()
    expect(collection.conflictMap).toBeDefined()
  })

  it('should set and get element correctly', () => {
    const testElement = {
      uuid: 'test-uuid',
      content_type: 'test-type',
      content: {},
      references: [],
    } as unknown as FullyFormedPayloadInterface

    collection.set(testElement)
    const element = collection.find('test-uuid')

    expect(element).toBe(testElement)
  })

  it('should check existence of an element correctly', () => {
    const testElement = {
      uuid: 'test-uuid',
      content_type: 'test-type',
      content: {},
      references: [],
    } as unknown as FullyFormedPayloadInterface

    collection.set(testElement)
    const hasElement = collection.has('test-uuid')

    expect(hasElement).toBe(true)
  })

  it('should return all elements', () => {
    const testElement1 = {
      uuid: 'test-uuid-1',
      content_type: 'test-type',
      content: {},
      references: [],
    } as unknown as FullyFormedPayloadInterface

    const testElement2 = {
      uuid: 'test-uuid-2',
      content_type: 'test-type',
      content: {},
      references: [],
    } as unknown as FullyFormedPayloadInterface

    collection.set(testElement1)
    collection.set(testElement2)

    const allElements = collection.all()

    expect(allElements).toEqual([testElement1, testElement2])
  })

  it('should add uuid to invalidsIndex if element is error decrypting', () => {
    const testElement = {
      uuid: 'test-uuid',
      content_type: 'test-type',
      content: 'encrypted content',
      errorDecrypting: true,
    } as unknown as FullyFormedPayloadInterface

    collection.set(testElement)

    expect(collection.invalidsIndex.has(testElement.uuid)).toBe(true)
  })

  it('should add uuid to invalidsIndex if element is encrypted', () => {
    const testElement = {
      uuid: 'test-uuid',
      content_type: 'test-type',
      content: 'encrypted content',
    } as unknown as FullyFormedPayloadInterface

    collection.set(testElement)

    expect(collection.invalidsIndex.has(testElement.uuid)).toBe(true)
  })

  it('should remove uuid from invalidsIndex if element is not encrypted', () => {
    const testElement1 = {
      uuid: 'test-uuid-1',
      content_type: 'test-type',
      content: 'encrypted content',
      errorDecrypting: true,
    } as unknown as FullyFormedPayloadInterface

    const testElement2 = {
      uuid: 'test-uuid-1',
      content_type: 'test-type',
      content: {},
      references: [],
    } as unknown as FullyFormedPayloadInterface

    collection.set(testElement1)
    expect(collection.invalidsIndex.has(testElement1.uuid)).toBe(true)

    collection.set(testElement2)
    expect(collection.invalidsIndex.has(testElement2.uuid)).toBe(false)
  })
})
