import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  createEditor,
  LexicalEditor,
  ParagraphNode,
} from 'lexical'
import { $getCaretTextOffset, $selectCaretTextOffset } from './superCaretOffset'

describe('caret text offset', () => {
  let editor: LexicalEditor

  const update = <T>(callback: () => T): T => {
    let result!: T
    editor.update(
      () => {
        result = callback()
      },
      { discrete: true },
    )
    return result
  }

  const paragraph = (...texts: string[]): ParagraphNode => {
    const node = $createParagraphNode()
    texts.forEach((text) => node.append(text === '\n' ? $createLineBreakNode() : $createTextNode(text)))
    return node
  }

  const selectionPoint = () =>
    editor.getEditorState().read(() => {
      const selection = $getSelection()
      return $isRangeSelection(selection)
        ? { text: selection.focus.getNode().getTextContent(), offset: selection.focus.offset }
        : undefined
    })

  const offsetOf = (select: () => void): number | undefined => {
    update(select)
    return editor.getEditorState().read($getCaretTextOffset)
  }

  beforeEach(() => {
    editor = createEditor({
      onError: (error) => {
        throw error
      },
    })
    editor.setRootElement(document.createElement('div'))
  })

  it('returns undefined when there is no range selection', () => {
    update(() => $getRoot().append(paragraph('ab')))

    expect(editor.getEditorState().read($getCaretTextOffset)).toBeUndefined()
  })

  it('round-trips a caret inside any text of a note', () => {
    update(() => $getRoot().append(paragraph('ab'), paragraph('cd', '\n', 'ef')))

    const positions = [
      { text: 'ab', offset: 0 },
      { text: 'ab', offset: 1 },
      { text: 'cd', offset: 1 },
      { text: 'ef', offset: 1 },
      { text: 'ef', offset: 2 },
    ]

    const offsets = positions.map((position) => {
      const offset = offsetOf(() => {
        const node = $getRoot()
          .getAllTextNodes()
          .find((text) => text.getTextContent() === position.text)
        node?.select(position.offset, position.offset)
      })
      return offset as number
    })

    expect(offsets).toEqual([0, 1, 3, 5, 6])

    offsets.forEach((offset, index) => {
      update(() => $selectCaretTextOffset(offset))
      expect(selectionPoint()).toEqual(positions[index])
    })
  })

  it('gives the end of a paragraph and the start of the next the same offset', () => {
    update(() => $getRoot().append(paragraph('ab'), paragraph('cd')))

    const endOfFirst = offsetOf(() => $getRoot().getAllTextNodes()[0].select(2, 2))
    const startOfSecond = offsetOf(() => $getRoot().getAllTextNodes()[1].select(0, 0))

    expect(endOfFirst).toBe(2)
    expect(startOfSecond).toBe(2)
  })

  it('counts a caret in an empty paragraph as the text before it', () => {
    update(() => $getRoot().append(paragraph('ab'), paragraph(), paragraph('cd')))

    expect(offsetOf(() => $getRoot().getChildAtIndex(1)?.selectStart())).toBe(2)
  })

  it('restores a caret in an empty paragraph to the end of the previous text', () => {
    update(() => $getRoot().append(paragraph('ab'), paragraph(), paragraph('cd')))

    const offset = offsetOf(() => $getRoot().getChildAtIndex(1)?.selectStart())

    update(() => $selectCaretTextOffset(offset as number))

    expect(selectionPoint()).toEqual({ text: 'ab', offset: 2 })
  })

  it('clamps an offset past the end of the note to the end of the last text', () => {
    update(() => $getRoot().append(paragraph('ab'), paragraph('cd')))

    expect(update(() => $selectCaretTextOffset(1000))).toBe(true)
    expect(selectionPoint()).toEqual({ text: 'cd', offset: 2 })
  })

  it('does nothing when the note has no text', () => {
    update(() => $getRoot().append(paragraph()))

    expect(update(() => $selectCaretTextOffset(3))).toBe(false)
  })
})
