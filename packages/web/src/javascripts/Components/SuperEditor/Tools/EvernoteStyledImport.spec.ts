/**
 * @jest-environment jsdom
 */

import { HeadlessSuperConverter } from './HeadlessSuperConverter'
import { EvernoteConverter } from '@standardnotes/ui-services/src/Import/EvernoteConverter/EvernoteConverter'
import { styledInlineEnex } from '@standardnotes/ui-services/src/Import/EvernoteConverter/testData'
import { GenerateUuid } from '@standardnotes/services'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'

type SuperDocNode = { text?: string; children?: SuperDocNode[]; type?: string }

function findTextNodeWithText(node: SuperDocNode, text: string): { style?: string } | null {
  if (node.type === 'text' && node.text === text) {
    return node as { style?: string }
  }
  for (const child of node.children ?? []) {
    const found = findTextNodeWithText(child, text)
    if (found) {
      return found
    }
  }
  return null
}

function findParentBlockType(node: SuperDocNode, text: string, parentType?: string): string | null {
  if (node.type === 'text' && node.text === text) {
    return parentType ?? null
  }
  for (const child of node.children ?? []) {
    const blockType = ['heading', 'paragraph'].includes(child.type ?? '') ? child.type : parentType
    const found = findParentBlockType(child, text, blockType)
    if (found) {
      return found
    }
  }
  return null
}

describe('Evernote styled inline import', () => {
  const crypto = { generateUUID: () => String(Math.random()) } as unknown as PureCryptoInterface
  const generateUuid = new GenerateUuid(crypto)

  it('preserves bold, underline, and font size through full Evernote import', async () => {
    const superConverter = new HeadlessSuperConverter()
    const evernoteConverter = new EvernoteConverter(generateUuid)

    const { successful, errored } = await evernoteConverter.convert(styledInlineEnex as unknown as File, {
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
    expect(superString).toContain('General:')
    expect(superString).toContain('"format":9')
    expect(superString).not.toMatch(/"type":"heading"/i)
    expect(superString).toMatch(/font-size:\s*14pt/i)

    const parsed = JSON.parse(superString)
    const generalTextNode = findTextNodeWithText(parsed.root, 'General:')
    expect(generalTextNode?.style).toMatch(/font-size:\s*14pt/i)

    const challengeTextNode = findTextNodeWithText(parsed.root, 'challenge')
    expect(challengeTextNode?.style ?? '').not.toMatch(/font-size/i)
    expect(findParentBlockType(parsed.root, 'challenge')).toBe('paragraph')
    expect(findParentBlockType(parsed.root, 'General:')).toBe('paragraph')

    const html = await superConverter.convertSuperStringToOtherFormat(superString, 'html')
    expect(html).not.toMatch(/<h[1-6]/i)
    expect(html).toMatch(/font-size:\s*14pt/i)
  })
})