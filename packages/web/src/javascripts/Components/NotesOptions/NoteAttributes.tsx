import { useMemo, FunctionComponent } from 'react'
import { SNNote, classNames } from '@standardnotes/snjs'
import { formatDateForContextMenu } from '@/Utils/DateUtils'
import { calculateReadTime } from './Utils/calculateReadTime'
import { countNoteAttributes } from './Utils/countNoteAttributes'
import { WebApplicationInterface } from '@standardnotes/ui-services'
import { formatSizeToReadableString } from '@standardnotes/filepicker'

export const useNoteAttributes = (application: WebApplicationInterface, note: SNNote) => {
  const { words, characters, paragraphs } = useMemo(() => countNoteAttributes(note.text), [note.text])

  const readTime = useMemo(() => (typeof words === 'number' ? calculateReadTime(words) : 'N/A'), [words])

  const userModifiedDate = useMemo(() => formatDateForContextMenu(note.userModifiedDate), [note.userModifiedDate])
  const serverUpdatedAt = useMemo(() => formatDateForContextMenu(note.serverUpdatedAt), [note.serverUpdatedAt])

  const dateCreated = useMemo(() => formatDateForContextMenu(note.created_at), [note.created_at])

  const size = useMemo(() => new Blob([note.text]).size, [note.text])

  const editor = application.componentManager.editorForNote(note)
  const format = editor.fileType

  return {
    size,
    words,
    characters,
    paragraphs,
    readTime,
    userModifiedDate,
    serverUpdatedAt,
    dateCreated,
    format,
  }
}

export const NoteAttributes: FunctionComponent<{
  application: WebApplicationInterface
  note: SNNote
  className?: string
}> = ({ application, note, className }) => {
  const { size, words, characters, paragraphs, readTime, userModifiedDate, dateCreated, format } = useNoteAttributes(
    application,
    note,
  )

  const canShowWordCount = typeof words === 'number' && (format === 'txt' || format === 'md')

  return (
    <div className={classNames('select-text px-3 py-1.5 text-sm font-medium text-neutral lg:text-xs', className)}>
      {canShowWordCount ? (
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
        <span className="font-semibold">Last modified:</span> {userModifiedDate}
      </div>
      <div className="mb-1">
        <span className="font-semibold">Created:</span> {dateCreated}
      </div>
      <div className="mb-1">
        <span className="font-semibold">Note ID:</span> {note.uuid}
      </div>
      <div>
        <span className="font-semibold">Size:</span> {formatSizeToReadableString(size)}
      </div>
    </div>
  )
}
