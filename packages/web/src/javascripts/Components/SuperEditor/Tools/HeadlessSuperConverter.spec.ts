/**
 * @jest-environment jsdom
 */

import { HeadlessSuperConverter } from './HeadlessSuperConverter'
import { EvernoteConverter } from '@standardnotes/ui-services/src/Import/EvernoteConverter/EvernoteConverter'
import { checkboxEnex, highlightEnex } from '@standardnotes/ui-services/src/Import/EvernoteConverter/testData'
import { SPAN_FONT_SIZE_ATTRIBUTE } from '@standardnotes/ui-services/src/Import/HighlightSpanImport'
import { GenerateUuid } from '@standardnotes/services'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'

describe('HeadlessSuperConverter', () => {
  it('imports mark tags as highlight format', () => {
    const converter = new HeadlessSuperConverter()
    const superString = converter.convertOtherFormatToSuperString('<p><mark>Line 2</mark></p>', 'html', {
      html: {
        addLineBreaks: false,
      },
    })

    expect(superString).toContain('"format":128')
  })

  it('imports Evernote highlight spans as highlight format with background color', () => {
    const converter = new HeadlessSuperConverter()
    const superString = converter.convertOtherFormatToSuperString(
      '<p><span style="--en-highlight:yellow;background-color: #ffef9e;">Line 2</span></p>',
      'html',
      {
        html: {
          addLineBreaks: false,
        },
      },
    )

    expect(superString).toContain('"format":128')
    expect(superString).toContain('background-color')
  })

  it('imports font size from spans carrying the Evernote font size attribute', () => {
    const converter = new HeadlessSuperConverter()
    const superString = converter.convertOtherFormatToSuperString(
      `<p><span ${SPAN_FONT_SIZE_ATTRIBUTE}="14pt"><strong><u>General:</u></strong></span></p>`,
      'html',
      {
        html: {
          addLineBreaks: false,
        },
      },
    )

    expect(superString).toContain('"format":9')
    expect(superString).toContain('font-size: 14pt')
  })

  it('does not import font size or formatting from unmarked spans, so pasted/other HTML is unchanged', () => {
    const converter = new HeadlessSuperConverter()
    const superString = converter.convertOtherFormatToSuperString(
      '<p><span style="font-size: 11pt; font-family: Arial;">Pasted</span></p>',
      'html',
      {
        html: {
          addLineBreaks: false,
        },
      },
    )

    expect(superString).not.toContain('font-size')
  })

  it('imports legacy -evernote-highlight spans as highlight format', () => {
    const converter = new HeadlessSuperConverter()
    const superString = converter.convertOtherFormatToSuperString(
      '<p><span style="background-color: rgb(255, 250, 165);-evernote-highlight:true;">Line 2</span></p>',
      'html',
      {
        html: {
          addLineBreaks: false,
        },
      },
    )

    expect(superString).toContain('"format":128')
  })

  it('imports Evernote checkbox lists as check list type', async () => {
    const crypto = {
      generateUUID: () => String(Math.random()),
    } as unknown as PureCryptoInterface
    const generateUuid = new GenerateUuid(crypto)
    const superConverter = new HeadlessSuperConverter()
    const evernoteConverter = new EvernoteConverter(generateUuid)

    const readFileAsText = async (file: File) => file as unknown as string

    const { successful } = await evernoteConverter.convert(checkboxEnex as unknown as File, {
      insertNote: async ({ text }) => ({ content: { text } }) as never,
      insertTag: async () => ({ content: { references: [] } }) as never,
      convertHTMLToSuper: (html, options) =>
        superConverter.convertOtherFormatToSuperString(html, 'html', { html: options }),
      convertMarkdownToSuper: jest.fn(),
      readFileAsText,
      canUseSuper: true,
      canUploadFiles: false,
      uploadFile: async () => void 0,
      linkItems: async () => void 0,
      cleanupItems: async () => void 0,
    })

    const superString = (successful?.[0] as unknown as { content: { text: string } }).content.text
    expect(superString).toContain('"listType":"check"')
  })

  it('exports imported Evernote highlights as mark elements', async () => {
    const crypto = {
      generateUUID: () => String(Math.random()),
    } as unknown as PureCryptoInterface
    const generateUuid = new GenerateUuid(crypto)
    const superConverter = new HeadlessSuperConverter()
    const evernoteConverter = new EvernoteConverter(generateUuid)

    const readFileAsText = async (file: File) => file as unknown as string

    const { successful } = await evernoteConverter.convert(highlightEnex as unknown as File, {
      insertNote: async ({ text }) => ({ content: { text } }) as never,
      insertTag: async () => ({ content: { references: [] } }) as never,
      convertHTMLToSuper: (html, options) =>
        superConverter.convertOtherFormatToSuperString(html, 'html', { html: options }),
      convertMarkdownToSuper: jest.fn(),
      readFileAsText,
      canUseSuper: true,
      canUploadFiles: false,
      uploadFile: async () => void 0,
      linkItems: async () => void 0,
      cleanupItems: async () => void 0,
    })

    const superString = (successful?.[0] as unknown as { content: { text: string } }).content.text
    expect(superString).toContain('"format":128')
    expect(superString).toContain('background-color')
  })
})
