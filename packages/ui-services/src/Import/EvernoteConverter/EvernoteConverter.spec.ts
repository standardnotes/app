/**
 * @jest-environment jsdom
 */

import { ContentType } from '@standardnotes/domain-core'
import { DecryptedTransferPayload, NoteContent, TagContent } from '@standardnotes/models'
import { EvernoteConverter, EvernoteResource } from './EvernoteConverter'
import { createTestResourceElement, enex, enexWithNoNoteOrTag } from './testData'
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
    getEmbeddedFileIDsFromSuperString: (superString: string) => [],
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

  it('should throw error if no note or tag in enex', () => {
    const converter = new EvernoteConverter(superConverterService, generateUuid)

    expect(() => converter.parseENEXData(enexWithNoNoteOrTag)).toThrowError()
  })

  it('should parse and strip html', () => {
    const converter = new EvernoteConverter(superConverterService, generateUuid)

    const result = converter.parseENEXData(enex, false)

    expect(result).not.toBeNull()
    expect(result?.length).toBe(3)
    expect(result?.[0].content_type).toBe(ContentType.TYPES.Note)
    expect((result?.[0] as DecryptedTransferPayload<NoteContent>).content.text).toBe('This is a test.\nh e ')
    expect(result?.[1].content_type).toBe(ContentType.TYPES.Note)
    expect((result?.[1] as DecryptedTransferPayload<NoteContent>).content.text).toBe(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    )
    expect(result?.[2].content_type).toBe(ContentType.TYPES.Tag)
    expect((result?.[2] as DecryptedTransferPayload<TagContent>).content.title).toBe('distant reading')
    expect((result?.[2] as DecryptedTransferPayload<TagContent>).content.references.length).toBe(2)
    expect((result?.[2] as DecryptedTransferPayload<TagContent>).content.references[0].uuid).toBe(result?.[0].uuid)
    expect((result?.[2] as DecryptedTransferPayload<TagContent>).content.references[1].uuid).toBe(result?.[1].uuid)
  })

  it('should parse and not strip html', () => {
    const converter = new EvernoteConverter(superConverterService, generateUuid)

    const result = converter.parseENEXData(enex, true)

    expect(result).not.toBeNull()
    expect(result?.length).toBe(3)
    expect(result?.[0].content_type).toBe(ContentType.TYPES.Note)
    expect((result?.[0] as DecryptedTransferPayload<NoteContent>).content.text).toBe(
      '<div>This is a test.</div><font><span>h </span><span>e </span></font>',
    )
    expect(result?.[1].content_type).toBe(ContentType.TYPES.Note)
    expect((result?.[1] as DecryptedTransferPayload<NoteContent>).content.text).toBe(
      '<div>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</div>',
    )
    expect(result?.[2].content_type).toBe(ContentType.TYPES.Tag)
    expect((result?.[2] as DecryptedTransferPayload<TagContent>).content.title).toBe('distant reading')
    expect((result?.[2] as DecryptedTransferPayload<TagContent>).content.references.length).toBe(2)
    expect((result?.[2] as DecryptedTransferPayload<TagContent>).content.references[0].uuid).toBe(result?.[0].uuid)
    expect((result?.[2] as DecryptedTransferPayload<TagContent>).content.references[1].uuid).toBe(result?.[1].uuid)
  })

  it('should convert lists to super format if applicable', () => {
    const unorderedList1 = document.createElement('ul')
    unorderedList1.style.setProperty('--en-todo', 'true')
    const listItem1 = document.createElement('li')
    listItem1.style.setProperty('--en-checked', 'true')
    const listItem2 = document.createElement('li')
    listItem2.style.setProperty('--en-checked', 'false')
    unorderedList1.appendChild(listItem1)
    unorderedList1.appendChild(listItem2)

    const unorderedList2 = document.createElement('ul')

    const array = [unorderedList1, unorderedList2]

    const converter = new EvernoteConverter(superConverterService, generateUuid)
    converter.convertListsToSuperFormatIfApplicable(array)

    expect(unorderedList1.getAttribute('__lexicallisttype')).toBe('check')
    expect(listItem1.getAttribute('aria-checked')).toBe('true')
    expect(listItem2.getAttribute('aria-checked')).toBe('false')
    expect(unorderedList2.getAttribute('__lexicallisttype')).toBeFalsy()
  })

  it('should replace media elements with resources', () => {
    const resources: EvernoteResource[] = [
      {
        hash: 'hash1',
        mimeType: 'image/png',
        data: 'data1',
        fileName: 'file1',
      },
    ]

    const parentElement = document.createElement('div')
    const mediaElement1 = document.createElement('en-media')
    mediaElement1.setAttribute('hash', 'hash1')
    const mediaElement2 = document.createElement('en-media')
    mediaElement2.setAttribute('hash', 'hash2')
    const mediaElement3 = document.createElement('en-media')
    mediaElement3.setAttribute('hash', 'hash1')
    parentElement.appendChild(mediaElement1)
    parentElement.appendChild(mediaElement2)

    const array = [mediaElement1, mediaElement2, mediaElement3]

    const converter = new EvernoteConverter(superConverterService, generateUuid)
    const replacedCount = converter.replaceMediaElementsWithResources(array, resources)

    expect(replacedCount).toBe(1)
  })

  describe('getResourceFromElement', () => {
    const converter = new EvernoteConverter(superConverterService, generateUuid)

    it('should return undefined if no mime type is present', () => {
      const resourceElementWithoutMimeType = createTestResourceElement(false)
      converter.getMD5HashFromBase64 = jest.fn().mockReturnValue('hash')
      expect(converter.getResourceFromElement(resourceElementWithoutMimeType)).toBeUndefined()
    })

    it('should generate md5 hash from base64 data if no source url is present', () => {
      const resourceElementWithoutSourceUrl = createTestResourceElement(true, false)
      converter.getMD5HashFromBase64 = jest.fn().mockReturnValue('hash')
      const resourceWithoutSourceUrl = converter.getResourceFromElement(resourceElementWithoutSourceUrl)
      expect(resourceWithoutSourceUrl).toBeDefined()
      expect(converter.getMD5HashFromBase64).toHaveBeenCalled()
    })

    it('should not generate md5 hash from base64 data if source url is present', () => {
      const resourceElementWithSourceUrl = createTestResourceElement(true, true)
      converter.getMD5HashFromBase64 = jest.fn().mockReturnValue('hash')
      const resourceWithSourceUrl = converter.getResourceFromElement(resourceElementWithSourceUrl)
      expect(resourceWithSourceUrl).toBeDefined()
      expect(converter.getMD5HashFromBase64).not.toHaveBeenCalled()
    })

    it('should return undefined if no data is present', () => {
      const resourceElementWithoutData = createTestResourceElement(true, false, true, false)
      converter.getMD5HashFromBase64 = jest.fn().mockReturnValue('hash')
      const resourceWithoutData = converter.getResourceFromElement(resourceElementWithoutData)
      expect(resourceWithoutData).toBeUndefined()
    })

    it('should return undefined if no source url and encoding is not base64', () => {
      const resourceElementWithoutSourceOrBase64 = createTestResourceElement(true, false, true, true, 'hex')
      converter.getMD5HashFromBase64 = jest.fn().mockReturnValue('hash')
      const resourceWithoutSourceOrBase64 = converter.getResourceFromElement(resourceElementWithoutSourceOrBase64)
      expect(resourceWithoutSourceOrBase64).toBeUndefined()
    })
  })
})
