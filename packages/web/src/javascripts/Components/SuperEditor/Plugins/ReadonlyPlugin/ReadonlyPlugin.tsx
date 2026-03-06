import { useApplication } from '@/Components/ApplicationProvider'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { SNNote, ContentType } from '@standardnotes/snjs'
import { useState, useEffect } from 'react'

const ReadonlyPlugin = ({ note, forceReadonly = false }: { note: SNNote; forceReadonly?: boolean }) => {
  const application = useApplication()
  const [editor] = useLexicalComposerContext()
  const [noteLocked, setNoteLocked] = useState(note.locked)

  useEffect(() => {
    return application.items.streamItems<SNNote>(ContentType.TYPES.Note, ({ changed }) => {
      const changedNoteItem = changed.find((changedItem) => changedItem.uuid === note.uuid)

      if (changedNoteItem) {
        setNoteLocked(changedNoteItem.locked)
      }
    })
  }, [application, note.uuid])

  useEffect(() => {
    editor.update(() => {
      editor.setEditable(!(noteLocked || forceReadonly))
    })
  }, [editor, noteLocked, forceReadonly])

  return null
}

export default ReadonlyPlugin
