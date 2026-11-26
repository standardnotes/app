/**
 * @jest-environment jsdom
 */

import { HeadlessSuperConverter } from '../../Tools/HeadlessSuperConverter'
import { EvernoteConverter } from '@standardnotes/ui-services/src/Import/EvernoteConverter/EvernoteConverter'
import { GenerateUuid } from '@standardnotes/services'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'

type TextNode = { text: string; format: number; style: string }

function collectTextNodes(node: { type?: string; children?: unknown[] }, result: TextNode[] = []): TextNode[] {
  if (node.type === 'text') {
    result.push(node as unknown as TextNode)
  }
  for (const child of (node.children ?? []) as { type?: string; children?: unknown[] }[]) {
    collectTextNodes(child, result)
  }
  return result
}

function importHTML(html: string): TextNode[] {
  const converter = new HeadlessSuperConverter()
  const superString = converter.convertOtherFormatToSuperString(html, 'html', { html: { addLineBreaks: false } })
  return collectTextNodes(JSON.parse(superString).root)
}

/** Runs the Evernote converter's span handling first, as in a real Evernote import */
function importEvernoteHTML(html: string): TextNode[] {
  const generateUuid = new GenerateUuid({ generateUUID: () => 'id' } as unknown as PureCryptoInterface)
  const root = document.createElement('div')
  root.innerHTML = html
  const evernoteConverter = new EvernoteConverter(generateUuid)
  evernoteConverter.convertSpanStylesToSuperFormatting(root)
  evernoteConverter.convertHighlightSpansToMarks(root)
  return importHTML(root.innerHTML)
}

describe('Evernote span styles imported through highlightHtmlImport', () => {
  it('applies bold only without setting a font size', () => {
    expect(importEvernoteHTML('<p><span style="font-weight: bold;">challenge</span></p>')).toEqual([
      expect.objectContaining({ text: 'challenge', format: 1, style: '' }),
    ])
  })

  it('applies bold, underline and font size together', () => {
    expect(
      importEvernoteHTML(
        '<p><span style="font-weight: bold; text-decoration: underline; font-size: 14pt;">General:</span></p>',
      ),
    ).toEqual([expect.objectContaining({ text: 'General:', format: 9, style: 'font-size: 14pt' })])
  })

  it('works when element.style is empty, as under a CSP without unsafe-inline', () => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style')
    Object.defineProperty(HTMLElement.prototype, 'style', {
      configurable: true,
      get: () => ({
        getPropertyValue: () => '',
        backgroundColor: '',
        display: '',
        textAlign: '',
        textIndent: '',
        verticalAlign: '',
        fontWeight: '',
        fontStyle: '',
        textDecoration: '',
      }),
    })
    try {
      expect(
        importEvernoteHTML(
          '<p><span style="font-weight: bold; text-decoration: underline; font-size: 14pt;">A</span></p>',
        ),
      ).toEqual([expect.objectContaining({ text: 'A', format: 9, style: 'font-size: 14pt' })])
    } finally {
      if (descriptor) {
        Object.defineProperty(HTMLElement.prototype, 'style', descriptor)
      }
    }
  })

  it('keeps italic, strikethrough and sub/superscript', () => {
    expect(
      importEvernoteHTML(
        '<p><span style="font-style: italic; text-decoration: line-through;">a</span><span style="vertical-align: super; font-size: 8pt;">2</span></p>',
      ),
    ).toEqual([
      expect.objectContaining({ text: 'a', format: 6 }),
      expect.objectContaining({ text: '2', format: 64, style: 'font-size: 8pt' }),
    ])
  })

  it('does not lose outer styles when spans are nested', () => {
    expect(
      importEvernoteHTML(
        '<p><span style="font-size: 14pt; font-weight: bold;"><span style="text-decoration: underline;">A</span></span></p>',
      ),
    ).toEqual([expect.objectContaining({ text: 'A', format: 9, style: 'font-size: 14pt' })])
  })

  it('lets an inner size override the outer one', () => {
    expect(
      importEvernoteHTML(
        '<p><span style="font-size: 14pt;">a<span style="font-size: 10pt;">b</span></span></p>',
      ),
    ).toEqual([
      expect.objectContaining({ text: 'a', style: 'font-size: 14pt' }),
      expect.objectContaining({ text: 'b', style: 'font-size: 10pt' }),
    ])
  })

  it('keeps the outer size inside an unstyled nested span', () => {
    expect(importEvernoteHTML('<p><span style="font-size: 14pt;">a<span>b</span></span></p>')).toEqual([
      expect.objectContaining({ text: 'ab', style: 'font-size: 14pt' }),
    ])
  })

  it('keeps both a highlight and a surrounding size', () => {
    const nodes = importEvernoteHTML(
      '<p><span style="font-size: 14pt;"><span style="--en-highlight:yellow;background-color: #ffef9e;">A</span></span></p>',
    )
    expect(nodes).toHaveLength(1)
    expect(nodes[0].format & 128).toBe(128)
    expect(nodes[0].style).toContain('font-size: 14pt')
    expect(nodes[0].style).toContain('background-color')
  })

  it('keeps formatting and font size declared on the highlighted span itself', () => {
    const nodes = importEvernoteHTML(
      '<p><span style="--en-highlight:yellow; background-color: #ffef9e; font-weight: bold; font-size: 14pt;">A</span></p>',
    )

    expect(nodes).toHaveLength(1)
    expect(nodes[0]).toEqual(
      expect.objectContaining({
        text: 'A',
        format: 129,
        style: expect.stringContaining('font-size: 14pt'),
      }),
    )
    expect(nodes[0].style).toContain('background-color')
  })

  it('does not import text or background colors from ordinary spans', () => {
    expect(
      importEvernoteHTML('<p><span style="color: red; background-color: blue; font-size: 11pt;">A</span></p>'),
    ).toEqual([expect.objectContaining({ text: 'A', style: 'font-size: 11pt' })])
  })

  it('ignores unsupported font size values', () => {
    expect(importEvernoteHTML('<p><span style="font-size: expression(alert(1));">A</span></p>')).toEqual([
      expect.objectContaining({ text: 'A', style: '' }),
    ])
  })
})

describe('highlightHtmlImport leaves other HTML alone', () => {
  it('does not import font size from spans that did not go through the Evernote converter', () => {
    // Bold and underline here come from Lexical's own default span handling, as before this change
    expect(
      importHTML('<p><span style="font-weight: bold; text-decoration: underline; font-size: 14pt;">A</span></p>'),
    ).toEqual([expect.objectContaining({ text: 'A', format: 9, style: '' })])
  })
})
