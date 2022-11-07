import { FunctionComponent, useCallback } from 'react'
import { ManagedBlockComponentInterface } from './BlockComponentInterface'
import { BlocksEditor } from '@standardnotes/blocks-editor'

const StringEllipses = '...'
const NotePreviewCharLimit = 160

export const BlockquoteBlock: FunctionComponent<ManagedBlockComponentInterface> = ({ block, onChange }) => {
  const handleChange = useCallback(
    (value: string) => {
      const content = value
      const truncate = content.length > NotePreviewCharLimit
      const substring = content.substring(0, NotePreviewCharLimit)
      const previewPlain = substring + (truncate ? StringEllipses : '')
      onChange({ content, previewPlain: previewPlain, previewHtml: undefined })
    },
    [onChange],
  )

  return (
    <BlocksEditor
      onChange={handleChange}
      initialValue={block.content}
      className="bullet [&>ul]:p-revert relative min-h-[250px] resize-none text-base focus:shadow-none focus:outline-none [&>ul]:list-inside"
    />
  )
}
