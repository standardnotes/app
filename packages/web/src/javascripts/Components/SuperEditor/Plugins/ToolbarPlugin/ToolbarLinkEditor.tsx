import Icon from '@/Components/Icon/Icon'
import { KeyboardKey } from '@standardnotes/ui-services'
import { sanitizeUrl } from '../../Lexical/Utils/sanitizeUrl'
import { TOGGLE_LINK_COMMAND } from '@lexical/link'
import { useCallback, useState, useRef, useEffect } from 'react'
import { GridSelection, LexicalEditor, NodeSelection, RangeSelection } from 'lexical'
import { classNames } from '@standardnotes/snjs'
import StyledTooltip from '@/Components/StyledTooltip/StyledTooltip'

type Props = {
  linkUrl: string
  isEditMode: boolean
  setEditMode: (isEditMode: boolean) => void
  editor: LexicalEditor
  lastSelection: RangeSelection | GridSelection | NodeSelection | null
  isAutoLink: boolean
}

const LinkEditor = ({ linkUrl, isEditMode, setEditMode, editor, lastSelection, isAutoLink }: Props) => {
  const [editedLinkUrl, setEditedLinkUrl] = useState('')
  const editModeContainer = useRef<HTMLDivElement>(null)

  const handleLinkSubmission = () => {
    if (lastSelection !== null) {
      if (editedLinkUrl !== '') {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl(editedLinkUrl))
      }
      setEditMode(false)
    }
  }

  const focusInput = useCallback((input: HTMLInputElement | null) => {
    if (input) {
      input.focus()
    }
  }, [])

  useEffect(() => {
    setEditedLinkUrl(linkUrl)
  }, [linkUrl])

  return isEditMode ? (
    <div className="flex items-center gap-2" ref={editModeContainer}>
      <input
        id="link-input"
        ref={focusInput}
        value={editedLinkUrl}
        onChange={(event) => {
          setEditedLinkUrl(event.target.value)
        }}
        onKeyDown={(event) => {
          if (event.key === KeyboardKey.Enter) {
            event.preventDefault()
            handleLinkSubmission()
          } else if (event.key === KeyboardKey.Escape) {
            event.preventDefault()
            setEditMode(false)
          }
        }}
        onBlur={(event) => {
          if (!editModeContainer.current?.contains(event.relatedTarget as Node)) {
            setEditMode(false)
          }
        }}
        className="flex-grow rounded-sm bg-contrast p-1 text-text sm:min-w-[40ch]"
      />
      <StyledTooltip showOnMobile showOnHover label="Cancel editing">
        <button
          className="flex select-none items-center justify-center rounded p-2 enabled:hover:bg-default disabled:opacity-50 md:border md:border-transparent enabled:hover:md:translucent-ui:border-[--popover-border-color]"
          onClick={() => {
            setEditMode(false)
            editor.focus()
          }}
          onMouseDown={(event) => event.preventDefault()}
        >
          <Icon type="close" size="medium" />
        </button>
      </StyledTooltip>
      <StyledTooltip showOnMobile showOnHover label="Save link">
        <button
          className="flex select-none items-center justify-center rounded p-2 enabled:hover:bg-default disabled:opacity-50 md:border md:border-transparent enabled:hover:md:translucent-ui:border-[--popover-border-color]"
          onClick={handleLinkSubmission}
          onMouseDown={(event) => event.preventDefault()}
        >
          <Icon type="check" size="medium" />
        </button>
      </StyledTooltip>
    </div>
  ) : (
    <div className="flex items-center gap-1">
      <a
        className={classNames(
          'mr-1 flex flex-grow items-center gap-2 overflow-hidden whitespace-nowrap underline',
          isAutoLink && 'py-2.5',
        )}
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon type="open-in" className="ml-1 flex-shrink-0" />
        <div className="max-w-[35ch] overflow-hidden text-ellipsis">{linkUrl}</div>
      </a>
      {!isAutoLink && (
        <>
          <StyledTooltip showOnMobile showOnHover label="Edit link">
            <button
              className="flex select-none items-center justify-center rounded p-2 enabled:hover:bg-default disabled:opacity-50 md:border md:border-transparent enabled:hover:md:translucent-ui:border-[--popover-border-color]"
              onClick={() => {
                setEditedLinkUrl(linkUrl)
                setEditMode(true)
              }}
              onMouseDown={(event) => event.preventDefault()}
            >
              <Icon type="pencil-filled" size="medium" />
            </button>
          </StyledTooltip>
          <StyledTooltip showOnMobile showOnHover label="Remove link">
            <button
              className="flex select-none items-center justify-center rounded p-2 enabled:hover:bg-default disabled:opacity-50 md:border md:border-transparent enabled:hover:md:translucent-ui:border-[--popover-border-color]"
              onClick={() => {
                editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
              }}
              onMouseDown={(event) => event.preventDefault()}
            >
              <Icon type="trash-filled" size="medium" />
            </button>
          </StyledTooltip>
        </>
      )}
    </div>
  )
}

export default LinkEditor
