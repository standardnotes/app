/**
 * @jest-environment jsdom
 */

import { ContentType } from '@standardnotes/domain-core'
import { DecryptedTransferPayload, NoteContent } from '@standardnotes/models'
import { EvernoteConverter } from './EvernoteConverter'
import { createTestResourceElement, enex } from './testData'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { GenerateUuid } from '@standardnotes/services'
import { SuperConverterServiceInterface } from '@standardnotes/files'

// Mock dayjs so dayjs.extend() doesn't throw an error in EvernoteConverter.ts
jest.mock('dayjs', () => {
  return {
    __esModule: true,
    default: {
      extend: jest.fn(),
      utc: jest.fn().mockReturnValue({
        toDate: jest.fn().mockReturnValue(new Date()),
      }),
    },
  }
})

describe('EvernoteConverter', () => {
  const crypto = {
    generateUUID: () => String(Math.random()),
  } as unknown as PureCryptoInterface

  const superConverterService: SuperConverterServiceInterface = {
    isValidSuperString: () => true,
    convertOtherFormatToSuperString: (data: string) => data,
    convertSuperStringToOtherFormat: (data: string) => data,
  }

  const generateUuid = new GenerateUuid(crypto)

  it('should throw error if DOMParser is not available', () => {
    const converter = new EvernoteConverter(superConverterService, generateUuid)

    const originalDOMParser = window.DOMParser
    // @ts-ignore
    window.DOMParser = undefined

    expect(() => converter.parseENEXData(enex)).toThrowError()

    window.DOMParser = originalDOMParser
  })

  it('should parse and strip html', () => {
    const converter = new EvernoteConverter(superConverterService, generateUuid)

    const result = converter.parseENEXData(enex, false)

    expect(result).not.toBeNull()
    expect(result?.length).toBe(2)
    expect(result?.[0].content_type).toBe(ContentType.TYPES.Note)
    expect((result?.[0] as DecryptedTransferPayload<NoteContent>).content.text).toBe('This is a test.')
    expect(result?.[1].content_type).toBe(ContentType.TYPES.Note)
    expect((result?.[1] as DecryptedTransferPayload<NoteContent>).content.text).toBe(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    )
  })

  it('should parse and not strip html', () => {
    const converter = new EvernoteConverter(superConverterService, generateUuid)

    const result = converter.parseENEXData(enex, true)

    expect(result).not.toBeNull()
    expect(result?.length).toBe(2)
    expect(result?.[0].content_type).toBe(ContentType.TYPES.Note)
    expect((result?.[0] as DecryptedTransferPayload<NoteContent>).content.text).toBe('<div>This is a test.</div>')
    expect(result?.[1].content_type).toBe(ContentType.TYPES.Note)
    expect((result?.[1] as DecryptedTransferPayload<NoteContent>).content.text).toBe(
      '<div>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</div>',
    )
  })

  describe('getResourceFromElement', () => {
    const converter = new EvernoteConverter(superConverterService, generateUuid)

    it('should return undefined if no mime type is present', () => {
      const resourceElementWithoutMimeType = createTestResourceElement(false)
      converter.getMD5HashFromBase64 = jest.fn().mockReturnValue('hash')
      expect(converter.getResourceFromElement(resourceElementWithoutMimeType, 0)).toBeUndefined()
    })

    it('should generate md5 hash from base64 data if no source url is present', () => {
      const resourceElementWithoutSourceUrl = createTestResourceElement(true, false)
      converter.getMD5HashFromBase64 = jest.fn().mockReturnValue('hash')
      const resourceWithoutSourceUrl = converter.getResourceFromElement(resourceElementWithoutSourceUrl, 0)
      expect(resourceWithoutSourceUrl).toBeDefined()
      expect(converter.getMD5HashFromBase64).toHaveBeenCalled()
    })

    it('should not generate md5 hash from base64 data if source url is present', () => {
      const resourceElementWithSourceUrl = createTestResourceElement(true, true)
      converter.getMD5HashFromBase64 = jest.fn().mockReturnValue('hash')
      const resourceWithSourceUrl = converter.getResourceFromElement(resourceElementWithSourceUrl, 0)
      expect(resourceWithSourceUrl).toBeDefined()
      expect(converter.getMD5HashFromBase64).not.toHaveBeenCalled()
    })

    it('should return undefined if no data is present', () => {
      const resourceElementWithoutData = createTestResourceElement(true, false, true, false)
      converter.getMD5HashFromBase64 = jest.fn().mockReturnValue('hash')
      const resourceWithoutData = converter.getResourceFromElement(resourceElementWithoutData, 0)
      expect(resourceWithoutData).toBeUndefined()
    })

    it('should return undefined if no source url and encoding is not base64', () => {
      const resourceElementWithoutSourceOrBase64 = createTestResourceElement(true, false, true, true, 'hex')
      converter.getMD5HashFromBase64 = jest.fn().mockReturnValue('hash')
      const resourceWithoutSourceOrBase64 = converter.getResourceFromElement(resourceElementWithoutSourceOrBase64, 0)
      expect(resourceWithoutSourceOrBase64).toBeUndefined()
    })
  })
})
