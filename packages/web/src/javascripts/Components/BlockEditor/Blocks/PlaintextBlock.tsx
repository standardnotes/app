import { PrefDefaults } from '@/Constants/PrefDefaults'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { getPlaintextFontSize } from '@/Utils/getPlaintextFontSize'
import { PrefKey } from '@standardnotes/snjs'
import { ChangeEventHandler, FunctionComponent, useCallback } from 'react'
import { ManagedBlockComponentInterface } from './BlockComponentInterface'

const StringEllipses = '...'
const NotePreviewCharLimit = 160

export const PlaintextBlock: FunctionComponent<ManagedBlockComponentInterface> = ({
  block,
  note,
  application,
  onFocus,
  onBlur,
  onChange,
}) => {
  const handleChange: ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    ({ currentTarget }) => {
      const content = currentTarget.value
      const truncate = content.length > NotePreviewCharLimit
      const substring = content.substring(0, NotePreviewCharLimit)
      const previewPlain = substring + (truncate ? StringEllipses : '')
      onChange({ content, previewPlain, previewHtml: undefined })
    },
    [onChange],
  )

  const lineHeight = application.getPreference(PrefKey.EditorLineHeight, PrefDefaults[PrefKey.EditorLineHeight])
  const fontSize = application.getPreference(PrefKey.EditorFontSize, PrefDefaults[PrefKey.EditorFontSize])

  return (
    <div>
      <textarea
        autoComplete="off"
        dir="auto"
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        readOnly={note.locked}
        spellCheck={note.spellcheck}
        value={block.content}
        className={classNames(
          'focus:shadow-none',
          'editable font-editor flex-grow',
          lineHeight && `leading-${lineHeight.toLowerCase()}`,
          fontSize && getPlaintextFontSize(fontSize),
        )}
      ></textarea>
    </div>
  )
}
