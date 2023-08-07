import Icon from '@/Components/Icon/Icon'
import { CloseIcon, CheckIcon, PencilFilledIcon, TrashFilledIcon } from '@standardnotes/icons'
import { KeyboardKey } from '@standardnotes/ui-services'
import { IconComponent } from '../../Lexical/Theme/IconComponent'
import { sanitizeUrl } from '../../Lexical/Utils/sanitizeUrl'
import { TOGGLE_LINK_COMMAND } from '@lexical/link'
import { useCallback, useState, useRef, useEffect } from 'react'
import { GridSelection, LexicalEditor, NodeSelection, RangeSelection } from 'lexical'
import { classNames } from '@standardnotes/snjs'

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
      if (linkUrl !== '') {
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
      <button
        className="flex rounded-lg p-3 hover:bg-contrast hover:text-text disabled:cursor-not-allowed"
        onClick={() => {
          setEditMode(false)
          editor.focus()
        }}
        aria-label="Cancel editing link"
        onMouseDown={(event) => event.preventDefault()}
      >
        <IconComponent size={15}>
          <CloseIcon />
        </IconComponent>
      </button>
      <button
        className="flex rounded-lg p-3 hover:bg-contrast hover:text-text disabled:cursor-not-allowed"
        onClick={handleLinkSubmission}
        aria-label="Save link"
        onMouseDown={(event) => event.preventDefault()}
      >
        <IconComponent size={15}>
          <CheckIcon />
        </IconComponent>
      </button>
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
          <button
            className="flex rounded-lg p-3 hover:bg-contrast hover:text-text disabled:cursor-not-allowed"
            onClick={() => {
              setEditedLinkUrl(linkUrl)
              setEditMode(true)
            }}
            aria-label="Edit link"
            onMouseDown={(event) => event.preventDefault()}
          >
            <IconComponent size={15}>
              <PencilFilledIcon />
            </IconComponent>
          </button>
          <button
            className="flex rounded-lg p-3 hover:bg-contrast hover:text-text disabled:cursor-not-allowed"
            onClick={() => {
              editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
            }}
            aria-label="Remove link"
            onMouseDown={(event) => event.preventDefault()}
          >
            <IconComponent size={15}>
              <TrashFilledIcon />
            </IconComponent>
          </button>
        </>
      )}
    </div>
  )
}

export default LinkEditor
