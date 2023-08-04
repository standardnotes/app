import { useApplication } from '@/Components/ApplicationProvider'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { SNNote, ContentType } from '@standardnotes/snjs'
import { useState, useEffect } from 'react'

const ReadonlyPlugin = ({ note }: { note: SNNote }) => {
  const application = useApplication()
  const [editor] = useLexicalComposerContext()
  const [readOnly, setReadOnly] = useState(note.locked)

  useEffect(() => {
    return application.items.streamItems<SNNote>(ContentType.TYPES.Note, ({ changed }) => {
      const changedNoteItem = changed.find((changedItem) => changedItem.uuid === note.uuid)

      if (changedNoteItem) {
        setReadOnly(changedNoteItem.locked)
      }
    })
  }, [application, note.uuid])

  useEffect(() => {
    editor.update(() => {
      editor.setEditable(!readOnly)
    })
  }, [editor, readOnly])

  return null
}

export default ReadonlyPlugin
