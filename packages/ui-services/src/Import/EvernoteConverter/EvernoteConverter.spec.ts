/**
 * @jest-environment jsdom
 */

import { ContentType } from '@standardnotes/domain-core'
import { SNNote, SNTag } from '@standardnotes/models'
import { EvernoteConverter, EvernoteResource } from './EvernoteConverter'
import { checkboxEnex, createTestResourceElement, emptyLineEnex, enTodoEnex, enex, highlightEnex } from './testData'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { GenerateUuid } from '@standardnotes/services'
import { Converter } from '../Converter'

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

  const generateUuid = new GenerateUuid(crypto)

  const readFileAsText = async (file: File) => file as unknown as string

  const dependencies: Parameters<Converter['convert']>[1] = {
    insertNote: async ({ text }) =>
      ({
        content_type: ContentType.TYPES.Note,
        content: {
          text,
          references: [],
        },
        uuid: generateUuid.execute().getValue(),
      }) as unknown as SNNote,
    insertTag: async ({ title }) =>
      ({
        content_type: ContentType.TYPES.Tag,
        content: {
          title,
          references: [],
        },
        uuid: generateUuid.execute().getValue(),
      }) as unknown as SNTag,
    convertHTMLToSuper: (data) => data,
    convertMarkdownToSuper: jest.fn(),
    readFileAsText,
    canUseSuper: false,
    canUploadFiles: false,
    uploadFile: async () => void 0,
    linkItems: async (item, itemToLink) => {
      itemToLink.content.references.push({
        content_type: item.content_type,
        uuid: item.uuid,
      })
    },
    cleanupItems: async () => void 0,
  }

  it('should parse and strip html', async () => {
    const converter = new EvernoteConverter(generateUuid)

    const { successful } = await converter.convert(enex as unknown as File, dependencies)

    expect(successful).not.toBeNull()
    expect(successful?.length).toBe(3)
    expect(successful?.[0].content_type).toBe(ContentType.TYPES.Note)
    expect((successful?.[0] as SNNote).content.text).toBe('This is a test.\nh e ')
    expect(successful?.[1].content_type).toBe(ContentType.TYPES.Tag)
    expect((successful?.[1] as SNTag).content.title).toBe('distant reading')
    expect((successful?.[1] as SNTag).content.references.length).toBe(2)
    expect((successful?.[1] as SNTag).content.references[0].uuid).toBe(successful?.[0].uuid)
    expect((successful?.[1] as SNTag).content.references[1].uuid).toBe(successful?.[2].uuid)
    expect(successful?.[2].content_type).toBe(ContentType.TYPES.Note)
    expect((successful?.[2] as SNNote).content.text).toBe('Lorem ipsum dolor sit amet, consectetur adipiscing elit.')
  })

  it('should parse and not strip html', async () => {
    const converter = new EvernoteConverter(generateUuid)

    const { successful } = await converter.convert(enex as unknown as File, {
      ...dependencies,
      canUseSuper: true,
    })

    expect(successful).not.toBeNull()
    expect(successful?.length).toBe(3)
    expect(successful?.[0].content_type).toBe(ContentType.TYPES.Note)
    expect((successful?.[0] as SNNote).content.text).toBe(
      '<p>This is a test.</p><ul></ul><ol></ol><font><span>h </span><span>e </span></font>',
    )
    expect(successful?.[1].content_type).toBe(ContentType.TYPES.Tag)
    expect((successful?.[1] as SNTag).content.title).toBe('distant reading')
    expect((successful?.[1] as SNTag).content.references.length).toBe(2)
    expect((successful?.[1] as SNTag).content.references[0].uuid).toBe(successful?.[0].uuid)
    expect((successful?.[1] as SNTag).content.references[1].uuid).toBe(successful?.[2].uuid)
    expect(successful?.[2].content_type).toBe(ContentType.TYPES.Note)
    expect((successful?.[2] as SNNote).content.text).toBe(
      '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>',
    )
  })

  it('should convert Evernote checkbox lists to super format', async () => {
    const converter = new EvernoteConverter(generateUuid)

    const { successful } = await converter.convert(checkboxEnex as unknown as File, {
      ...dependencies,
      canUseSuper: true,
    })

    expect((successful?.[0] as SNNote).content.text).toContain('__lexicallisttype="check"')
    expect((successful?.[0] as SNNote).content.text).toContain('aria-checked="true"')
    expect((successful?.[0] as SNNote).content.text).toContain('aria-checked="false"')
  })

  it('should convert Evernote checkbox lists to plaintext checkboxes without super', async () => {
    const converter = new EvernoteConverter(generateUuid)

    const { successful } = await converter.convert(checkboxEnex as unknown as File, dependencies)

    expect((successful?.[0] as SNNote).content.text).toBe('- [x] Line 1\n- [ ] Line 2\n')
  })

  it('should convert en-todo tags to super checklist format', async () => {
    const converter = new EvernoteConverter(generateUuid)

    const { successful } = await converter.convert(enTodoEnex as unknown as File, {
      ...dependencies,
      canUseSuper: true,
    })

    expect((successful?.[0] as SNNote).content.text).toContain('__lexicallisttype="check"')
    expect((successful?.[0] as SNNote).content.text).toContain('Checked item')
    expect((successful?.[0] as SNNote).content.text).toContain('Unchecked item')
  })

  it('should convert lists to super format if applicable', () => {
    const converter = new EvernoteConverter(generateUuid)
    const noteElement = document.createElement('en-note')
    const unorderedList1 = document.createElement('ul')
    unorderedList1.style.setProperty('--en-todo', 'true')
    const listItem1 = document.createElement('li')
    listItem1.style.setProperty('--en-checked', 'true')
    const listItem2 = document.createElement('li')
    listItem2.style.setProperty('--en-checked', 'false')
    unorderedList1.appendChild(listItem1)
    unorderedList1.appendChild(listItem2)

    const unorderedList2 = document.createElement('ul')
    noteElement.appendChild(unorderedList1)
    noteElement.appendChild(unorderedList2)

    converter.convertEvernoteChecklists(noteElement, true)

    expect(unorderedList1.getAttribute('__lexicallisttype')).toBe('check')
    expect(listItem1.getAttribute('aria-checked')).toBe('true')
    expect(listItem2.getAttribute('aria-checked')).toBe('false')
    expect(unorderedList2.getAttribute('__lexicallisttype')).toBeFalsy()
  })

  it('should preserve single empty lines from Evernote br-only divs', async () => {
    const converter = new EvernoteConverter(generateUuid)

    const { successful } = await converter.convert(emptyLineEnex as unknown as File, dependencies)

    expect((successful?.[0] as SNNote).content.text).toBe('line1\n\nline2')
  })

  it('should convert highlight spans to mark elements', () => {
    const converter = new EvernoteConverter(generateUuid)
    const root = document.createElement('div')
    root.innerHTML =
      '<span style="--en-highlight:yellow;background-color: #ffef9e;">Line 2</span><span>plain</span>'

    converter.convertHighlightSpansToMarks(root)

    expect(root.querySelector('span')?.textContent).toBe('plain')
    expect(root.querySelector('mark')?.textContent).toBe('Line 2')
  })

  it('should convert highlight spans to mark elements before Super import', async () => {
    const converter = new EvernoteConverter(generateUuid)

    const { successful } = await converter.convert(highlightEnex as unknown as File, {
      ...dependencies,
      canUseSuper: true,
    })

    expect((successful?.[0] as SNNote).content.text).toContain('<mark')
    expect((successful?.[0] as SNNote).content.text).not.toMatch(/<span[^>]*--en-highlight/)
  })

  it('should convert Evernote br-only divs to empty paragraphs for Super', async () => {
    const converter = new EvernoteConverter(generateUuid)

    const { successful } = await converter.convert(emptyLineEnex as unknown as File, {
      ...dependencies,
      canUseSuper: true,
    })

    expect((successful?.[0] as SNNote).content.text).toBe('<p>line1</p><p></p><p>line2</p>')
  })

  it('should replace media elements with resources', async () => {
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

    const converter = new EvernoteConverter(generateUuid)
    const { replacedElements } = await converter.replaceMediaElementsWithResources(
      array,
      resources,
      false,
      dependencies.uploadFile,
    )

    expect(replacedElements.length).toBe(1)
  })

  describe('getResourceFromElement', () => {
    const converter = new EvernoteConverter(generateUuid)

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
