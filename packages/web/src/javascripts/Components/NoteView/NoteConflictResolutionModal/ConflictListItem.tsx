import { SNNote, classNames } from '@standardnotes/snjs'
import { MouseEventHandler } from 'react'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { useApplication } from '../../ApplicationProvider'
import { useNoteAttributes } from '../../NotesOptions/NoteAttributes'
import CheckIndicator from '../../Checkbox/CheckIndicator'
import { VisuallyHidden } from '@ariakit/react'
import Icon from '../../Icon/Icon'
import StyledTooltip from '../../StyledTooltip/StyledTooltip'

export const ConflictListItem = ({
  isSelected,
  onClick,
  title,
  note,
  disabled,
}: {
  isSelected: boolean
  disabled: boolean
  onClick: MouseEventHandler<HTMLButtonElement>
  title: string
  note: SNNote
}) => {
  const application = useApplication()
  const { words, characters, paragraphs, serverUpdatedAt, dateCreated, format } = useNoteAttributes(application, note)

  return (
    <button
      tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
      className={classNames(
        'flex w-full select-none flex-col overflow-hidden border-l-2 bg-transparent px-3 py-2.5 pl-4 text-left text-sm text-text',
        isSelected ? 'border-info bg-info-backdrop' : 'border-transparent',
        disabled
          ? 'cursor-not-allowed opacity-75'
          : 'cursor-pointer hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none',
      )}
      onClick={onClick}
      data-selected={isSelected}
      disabled={disabled}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <CheckIndicator checked={isSelected} />
        <div className="font-semibold">{title}</div>
      </div>
      <div className="w-full text-sm text-neutral lg:text-xs">
        <div className="mb-1.5 flex items-center gap-2">
          <StyledTooltip gutter={8} label="Last modified" className="!z-modal">
            <div className="flex-shrink-0">
              <Icon type="restore" size="medium" />
            </div>
          </StyledTooltip>
          <VisuallyHidden>Last modified</VisuallyHidden> {serverUpdatedAt}
        </div>
        <div className="mb-1.5 flex items-center gap-2">
          <StyledTooltip gutter={8} label="Created" className="!z-modal">
            <div className="flex-shrink-0">
              <Icon type="pencil-filled" size="medium" />
            </div>
          </StyledTooltip>
          <VisuallyHidden>Created</VisuallyHidden> {dateCreated}
        </div>
        <div className="mb-1.5 flex items-center gap-2 overflow-hidden">
          <StyledTooltip gutter={8} label="Note ID" className="!z-modal">
            <div className="flex-shrink-0">
              <Icon type="info" size="medium" />
            </div>
          </StyledTooltip>
          <VisuallyHidden>Note ID</VisuallyHidden>
          <div className="overflow-hidden text-ellipsis whitespace-nowrap">{note.uuid}</div>
        </div>
        {typeof words === 'number' && (format === 'txt' || format === 'md') ? (
          <div className="flex items-center gap-2">
            <StyledTooltip gutter={8} label={`${words} words`} className="!z-modal">
              <div className="flex items-center gap-1">
                <Icon type="line-width" size="medium" />
                {words}
              </div>
            </StyledTooltip>
            <StyledTooltip gutter={8} label={`${characters} characters`} className="!z-modal">
              <div className="flex items-center gap-1">
                <Icon type="bold" size="small" />
                <span>{characters}</span>
              </div>
            </StyledTooltip>
            <StyledTooltip gutter={8} label={`${paragraphs} paragraphs`} className="!z-modal">
              <div className="flex items-center gap-1">
                <Icon type="paragraph" size="medium" />
                <span>{paragraphs}</span>
              </div>
            </StyledTooltip>
          </div>
        ) : null}
      </div>
    </button>
  )
}
