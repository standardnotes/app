/**
 * @jest-environment jsdom
 */

import { ElementIds } from '@/Constants/ElementIDs'
import { SuperEditorContentId } from '@/Components/SuperEditor/Constants'
import { getNoteEditorScrollElement } from './getNoteEditorScrollElement'

describe('getNoteEditorScrollElement', () => {
  it('returns the plain editor textarea', () => {
    const textarea = document.createElement('textarea')
    const plainEditor = {
      getTextarea: () => textarea,
    }

    const scrollElement = getNoteEditorScrollElement({
      editorMode: 'plain',
      editorContentElement: null,
      plainEditor: plainEditor as never,
    })

    expect(scrollElement).toBe(textarea)
  })

  it('returns the super editor content editable root when it overflows', () => {
    const editorContent = document.createElement('div')
    editorContent.id = ElementIds.EditorContent

    const contentEditable = document.createElement('div')
    contentEditable.id = SuperEditorContentId
    contentEditable.className = 'ContentEditable__root'
    Object.defineProperty(contentEditable, 'scrollHeight', { value: 800, configurable: true })
    Object.defineProperty(contentEditable, 'clientHeight', { value: 400, configurable: true })

    editorContent.appendChild(contentEditable)
    document.body.appendChild(editorContent)

    const scrollElement = getNoteEditorScrollElement({
      editorMode: 'super',
      editorContentElement: editorContent,
    })

    expect(scrollElement).toBe(contentEditable)

    document.body.removeChild(editorContent)
  })

  it('returns the editor content wrapper for component mode', () => {
    const editorContent = document.createElement('div')
    editorContent.id = ElementIds.EditorContent

    const scrollElement = getNoteEditorScrollElement({
      editorMode: 'component',
      editorContentElement: editorContent,
    })

    expect(scrollElement).toBe(editorContent)
  })
})
