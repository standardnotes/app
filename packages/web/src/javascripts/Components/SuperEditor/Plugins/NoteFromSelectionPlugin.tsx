import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR, createCommand } from 'lexical'
import { useEffect } from 'react'
import { useApplication } from '../../ApplicationProvider'
import { NativeFeatureIdentifier, SNNote } from '@standardnotes/snjs'
import { $generateJSONFromSelectedNodes } from '@lexical/clipboard'
import { HeadlessSuperConverter } from '../Tools/HeadlessSuperConverter'
import { INSERT_BUBBLE_COMMAND } from './Commands'

export const CREATE_NOTE_FROM_SELECTION_COMMAND = createCommand<void>('CREATE_NOTE_FROM_SELECTION_COMMAND')

export function NoteFromSelectionPlugin({ currentNote }: { currentNote: SNNote }) {
  const application = useApplication()
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    async function insertAndLinkNewNoteFromJSON(json: string) {
      editor.setEditable(false)
      try {
        const insertedNote = await application.notesController.createNoteWithContent(
          NativeFeatureIdentifier.TYPES.SuperEditor,
          application.itemListController.titleForNewNote(),
          json,
        )
        await application.linkingController.linkItems(currentNote, insertedNote)
        editor.dispatchCommand(INSERT_BUBBLE_COMMAND, insertedNote.uuid)
      } catch (error) {
        console.error(error)
      } finally {
        editor.setEditable(true)
      }
    }

    return editor.registerCommand(
      CREATE_NOTE_FROM_SELECTION_COMMAND,
      function createNoteFromSelection() {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) {
          return true
        }
        const { nodes } = $generateJSONFromSelectedNodes(editor, selection)
        const converter = new HeadlessSuperConverter()
        const json = converter.getStringifiedJSONFromSerializedNodes(nodes)
        insertAndLinkNewNoteFromJSON(json).catch(console.error)
        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [application.itemListController, application.linkingController, application.notesController, currentNote, editor])

  return null
}
