import { act } from 'react-dom/test-utils'
import { createRoot, Root } from 'react-dom/client'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { $createParagraphNode, $createTextNode, $getRoot, createEditor, LexicalEditor } from 'lexical'
import { PrefKey, SNNote } from '@standardnotes/models'
import { PreferenceServiceInterface } from '@standardnotes/snjs'
import EditorRefPlugin from '@/Components/SuperEditor/Plugins/EditorRefPlugin/EditorRefPlugin'
import { featureTrunkRestoreEditorPositionEnabled } from '@/FeatureTrunk'
import { restoreSuperEditorCaret } from './restoreSuperEditorCaret'
import { getSuperEditorCaretOffset } from './superCaretOffset'

jest.mock('@/FeatureTrunk', () => ({ featureTrunkRestoreEditorPositionEnabled: jest.fn() }))

const preferences = {
  getValue: (key: PrefKey, defaultValue: unknown) => {
    if (key === PrefKey.RestoreEditorPosition) {
      return true
    }
    return key === PrefKey.RestoreEditorPositionEnabledAt ? 1_000 : defaultValue
  },
} as unknown as PreferenceServiceInterface

const serializedNote = () => {
  const editor = createEditor({ nodes: [HeadingNode, QuoteNode] })
  editor.update(
    () => {
      $getRoot().append(
        $createParagraphNode().append($createTextNode('ab')),
        $createParagraphNode().append($createTextNode('cdef')),
      )
    },
    { discrete: true },
  )
  return JSON.stringify(editor.getEditorState().toJSON())
}

describe('restoreSuperEditorCaret', () => {
  let container: HTMLDivElement
  let root: Root
  let editor: LexicalEditor | null
  let rootElementWhenRefWasSet: HTMLElement | null | undefined

  const mount = async () => {
    await act(async () => {
      root.render(
        <LexicalComposer
          initialConfig={{
            namespace: 'test',
            nodes: [HeadingNode, QuoteNode],
            onError: (error) => {
              throw error
            },
            editorState: serializedNote(),
          }}
        >
          <RichTextPlugin
            contentEditable={<ContentEditable />}
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <EditorRefPlugin
            ref={(ref) => {
              editor = ref
              rootElementWhenRefWasSet = ref?.getRootElement()
            }}
          />
        </LexicalComposer>,
      )
    })
  }

  const restore = (note: object) => {
    act(() => restoreSuperEditorCaret(editor as LexicalEditor, note as SNNote, preferences))
  }

  const contentEditable = () => container.querySelector('[contenteditable]')

  beforeAll(() => {
    Range.prototype.getBoundingClientRect = () =>
      ({ top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0 }) as DOMRect
    Element.prototype.scrollIntoView = jest.fn()
  })

  beforeEach(async () => {
    ;(featureTrunkRestoreEditorPositionEnabled as jest.Mock).mockReturnValue(true)
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await mount()
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('has a root element by the time the editor ref is handed out', () => {
    expect(rootElementWhenRefWasSet).toBe(contentEditable())
  })

  it('restores the stored caret into the DOM selection and focuses the editor', () => {
    restore({ lastCaretOffset: 5, lastCaretAt: 2_000, userModifiedDate: new Date(2_000) })

    const selection = window.getSelection()
    expect(document.activeElement).toBe(contentEditable())
    expect(selection?.focusNode?.textContent).toBe('cdef')
    expect(selection?.focusOffset).toBe(3)
  })

  it('scrolls the element holding the restored caret to the center', () => {
    const scrollIntoView = jest.fn()
    Element.prototype.scrollIntoView = scrollIntoView

    restore({ lastCaretOffset: 5, lastCaretAt: 2_000, userModifiedDate: new Date(2_000) })

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center' })
    expect(scrollIntoView.mock.contexts[0].textContent).toBe('cdef')
  })

  it('focuses the editor when there is no caret to restore', () => {
    restore({ userModifiedDate: new Date(2_000) })

    expect(document.activeElement).toBe(contentEditable())
  })

  it('does not restore the caret when the note was edited after it was captured', () => {
    restore({ lastCaretOffset: 5, lastCaretAt: 2_000, userModifiedDate: new Date(3_000) })

    expect(document.activeElement).toBe(contentEditable())
    expect(window.getSelection()?.focusNode?.textContent).not.toBe('cdef')
  })

  it('does nothing when the setting is disabled', () => {
    ;(featureTrunkRestoreEditorPositionEnabled as jest.Mock).mockReturnValue(false)

    restore({ lastCaretOffset: 5, lastCaretAt: 2_000, userModifiedDate: new Date(2_000) })

    expect(document.activeElement).not.toBe(contentEditable())
  })

  it('reads the caret offset of the current selection', () => {
    act(() => {
      editor?.update(
        () => {
          $getRoot().getAllTextNodes()[1].select(2, 2)
        },
        { discrete: true },
      )
    })

    expect(getSuperEditorCaretOffset(editor as LexicalEditor)).toBe(4)
  })
})
