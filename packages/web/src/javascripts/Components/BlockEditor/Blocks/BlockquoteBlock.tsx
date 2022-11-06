import { PrefDefaults } from '@/Constants/PrefDefaults'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { getPlaintextFontSize } from '@/Utils/getPlaintextFontSize'
import { PrefKey } from '@standardnotes/snjs'
import { FormEventHandler, FunctionComponent, useCallback } from 'react'
import { ManagedBlockComponentInterface } from './BlockComponentInterface'

const StringEllipses = '...'
const NotePreviewCharLimit = 160

export const BlockquoteBlock: FunctionComponent<ManagedBlockComponentInterface> = ({
  block,
  note,
  application,
  onFocus,
  onBlur,
  onChange,
}) => {
  const handleChange: FormEventHandler<HTMLQuoteElement> = useCallback(
    ({ currentTarget }) => {
      const content = currentTarget.textContent || ''
      const truncate = content.length > NotePreviewCharLimit
      const substring = content.substring(0, NotePreviewCharLimit)
      const previewPlain = substring + (truncate ? StringEllipses : '')
      onChange({ content: content, previewPlain, previewHtml: undefined })
    },
    [onChange],
  )

  const lineHeight = application.getPreference(PrefKey.EditorLineHeight, PrefDefaults[PrefKey.EditorLineHeight])
  const fontSize = application.getPreference(PrefKey.EditorFontSize, PrefDefaults[PrefKey.EditorFontSize])

  return (
    <blockquote
      contentEditable="true"
      onInput={handleChange}
      dir="auto"
      onFocus={onFocus}
      onBlur={onBlur}
      spellCheck={note.spellcheck}
      suppressContentEditableWarning={true}
      className={classNames(
        'bg-info italic focus:shadow-none',
        'editable font-editor flex-grow',
        lineHeight && `leading-${lineHeight.toLowerCase()}`,
        fontSize && getPlaintextFontSize(fontSize),
      )}
    >
      <p>{block.content}</p>
    </blockquote>
  )
}
