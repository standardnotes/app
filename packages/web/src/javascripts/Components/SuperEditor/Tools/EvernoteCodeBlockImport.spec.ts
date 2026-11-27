/**
 * @jest-environment jsdom
 */

import { HeadlessSuperConverter } from './HeadlessSuperConverter'
import { EvernoteConverter } from '@standardnotes/ui-services/src/Import/EvernoteConverter/EvernoteConverter'
import { codeBlockEnex } from '@standardnotes/ui-services/src/Import/EvernoteConverter/testData'
import { GenerateUuid } from '@standardnotes/services'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'

type SuperDocNode = { type?: string; language?: string; text?: string; children?: SuperDocNode[] }

describe('Evernote code block import', () => {
  it('imports an Evernote code block as a Super code block with its language and lines', async () => {
    const generateUuid = new GenerateUuid({ generateUUID: () => 'id' } as unknown as PureCryptoInterface)
    const superConverter = new HeadlessSuperConverter()
    const evernoteConverter = new EvernoteConverter(generateUuid)

    const { successful, errored } = await evernoteConverter.convert(codeBlockEnex as unknown as File, {
      insertNote: async ({ text }) => ({ content: { text } }) as never,
      insertTag: async () => ({ content: { references: [] } }) as never,
      convertHTMLToSuper: (html, options) =>
        superConverter.convertOtherFormatToSuperString(html, 'html', { html: options }),
      convertMarkdownToSuper: jest.fn(),
      readFileAsText: async (file) => file as unknown as string,
      canUseSuper: true,
      canUploadFiles: false,
      uploadFile: async () => void 0,
      linkItems: async () => void 0,
      cleanupItems: async () => void 0,
    })

    expect(errored).toHaveLength(0)
    const superString = (successful[0] as unknown as { content: { text: string } }).content.text
    const root = JSON.parse(superString).root as SuperDocNode

    // The importer always leaves a trailing empty paragraph, so only check the first three blocks
    expect(root.children?.slice(0, 3).map((child) => child.type)).toEqual(['paragraph', 'code', 'paragraph'])

    const codeNode = root.children?.[1] as SuperDocNode
    expect(codeNode.language).toBe('sql')

    // Flatten the code node: text nodes are code lines, linebreaks separate them
    const code = (codeNode.children ?? []).map((child) => (child.type === 'linebreak' ? '\n' : child.text)).join('')
    expect(code).toBe("SELECT id, name\nFROM users\n\n  WHERE id < 10 AND name = 'a & b';")
  })
})
