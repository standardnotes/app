import { useMemo, FunctionComponent } from 'react'
import { SNApplication, SNNote } from '@standardnotes/snjs'
import { formatDateForContextMenu } from '@/Utils/DateUtils'
import { calculateReadTime } from './Utils/calculateReadTime'
import { countNoteAttributes } from './Utils/countNoteAttributes'

export const NoteAttributes: FunctionComponent<{
  application: SNApplication
  note: SNNote
}> = ({ application, note }) => {
  const { words, characters, paragraphs } = useMemo(() => countNoteAttributes(note.text), [note.text])

  const readTime = useMemo(() => (typeof words === 'number' ? calculateReadTime(words) : 'N/A'), [words])

  const dateLastModified = useMemo(() => formatDateForContextMenu(note.userModifiedDate), [note.userModifiedDate])

  const dateCreated = useMemo(() => formatDateForContextMenu(note.created_at), [note.created_at])

  const editor = application.componentManager.editorForNote(note)
  const format = editor?.package_info?.file_type || 'txt'

  return (
    <div className="select-text px-3 py-1.5 text-sm font-medium text-neutral lg:text-xs">
      {typeof words === 'number' && (format === 'txt' || format === 'md') ? (
        <>
          <div className="mb-1">
            {words} words · {characters} characters · {paragraphs} paragraphs
          </div>
          <div className="mb-1">
            <span className="font-semibold">Read time:</span> {readTime}
          </div>
        </>
      ) : null}
      <div className="mb-1">
        <span className="font-semibold">Last modified:</span> {dateLastModified}
      </div>
      <div className="mb-1">
        <span className="font-semibold">Created:</span> {dateCreated}
      </div>
      <div>
        <span className="font-semibold">Note ID:</span> {note.uuid}
      </div>
    </div>
  )
}
