import { WebApplication } from '@/Application/Application'
import { SNNote } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useRef } from 'react'
import { BlockEditorController } from './BlockEditorController'
import { BlocksEditor } from '@standardnotes/blocks-editor'
import { ErrorBoundary } from '@/Utils/ErrorBoundary'

const StringEllipses = '...'
const NotePreviewCharLimit = 160

type Props = {
  application: WebApplication
  note: SNNote
}

export const BlockEditor: FunctionComponent<Props> = ({ note, application }) => {
  const controller = useRef(new BlockEditorController(note, application))

  const handleChange = useCallback(
    (value: string) => {
      const content = value
      const truncate = content.length > NotePreviewCharLimit
      const substring = content.substring(0, NotePreviewCharLimit)
      const previewPlain = substring + (truncate ? StringEllipses : '')
      void controller.current.save({ text: content, previewPlain: previewPlain, previewHtml: undefined })
    },
    [controller],
  )

  return (
    <div className="relative h-full w-full p-5">
      <ErrorBoundary>
        <BlocksEditor
          onChange={handleChange}
          initialValue={note.content.text}
          className="relative relative resize-none text-base focus:shadow-none focus:outline-none"
        />
      </ErrorBoundary>
    </div>
  )
}
