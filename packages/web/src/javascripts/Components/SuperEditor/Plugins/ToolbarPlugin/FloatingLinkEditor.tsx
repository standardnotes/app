import { getPositionedPopoverStyles } from '@/Components/Popover/GetPositionedPopoverStyles'
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  LexicalEditor,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getDOMRangeRect } from '../../Lexical/Utils/getDOMRangeRect'
import { classNames } from '@standardnotes/snjs'
import Icon from '@/Components/Icon/Icon'
import StyledTooltip from '@/Components/StyledTooltip/StyledTooltip'
import { TOGGLE_LINK_COMMAND } from '@lexical/link'
import Portal from '@/Components/Portal/Portal'
import { mergeRegister } from '@lexical/utils'
import { KeyboardKey } from '@standardnotes/ui-services'
import Button from '@/Components/Button/Button'
import { sanitizeUrl } from '../../Lexical/Utils/sanitizeUrl'
import { getSelectedNode } from '../../Lexical/Utils/getSelectedNode'
import { $isLinkTextNode } from './ToolbarLinkTextEditor'
import { useElementResize } from '@/Hooks/useElementRect'

const FloatingLinkEditor = ({
  linkUrl,
  linkText,
  isEditMode,
  setEditMode,
  editor,
  isAutoLink,
  isLinkText,
  isMobile,
}: {
  linkUrl: string
  linkText: string
  isEditMode: boolean
  setEditMode: (isEditMode: boolean) => void
  editor: LexicalEditor
  isLinkText: boolean
  isAutoLink: boolean
  isMobile: boolean
}) => {
  const [editedLinkUrl, setEditedLinkUrl] = useState(() => linkUrl)
  useEffect(() => {
    setEditedLinkUrl(linkUrl)
  }, [linkUrl])
  const [editedLinkText, setEditedLinkText] = useState(() => linkText)
  useEffect(() => {
    setEditedLinkText(linkText)
  }, [linkText])

  const linkEditorRef = useRef<HTMLDivElement>(null)
  const rangeRect = useRef<DOMRect>()

  const updateLinkEditorPosition = useCallback(() => {
    if (isMobile) {
      return
    }

    const linkEditorElement = linkEditorRef.current

    if (!linkEditorElement) {
      setTimeout(updateLinkEditorPosition)
      return
    }

    const nativeSelection = window.getSelection()
    const rootElement = editor.getRootElement()

    if (nativeSelection !== null && rootElement !== null) {
      if (rootElement.contains(nativeSelection.anchorNode)) {
        rangeRect.current = getDOMRangeRect(nativeSelection, rootElement)
      }
      const linkEditorRect = linkEditorElement.getBoundingClientRect()
      const rootElementRect = rootElement.getBoundingClientRect()

      const calculatedStyles = getPositionedPopoverStyles({
        align: 'center',
        side: 'top',
        anchorRect: rangeRect.current,
        popoverRect: linkEditorRect,
        documentRect: rootElementRect,
        offset: 12,
        maxHeightFunction: () => 'none',
      })
      if (calculatedStyles) {
        Object.entries(calculatedStyles).forEach(([key, value]) => {
          linkEditorElement.style.setProperty(key, value)
        })
        linkEditorElement.style.opacity = '1'
      }
    }
  }, [editor, isMobile])

  useElementResize(linkEditorRef.current, updateLinkEditorPosition)

  useEffect(() => {
    updateLinkEditorPosition()

    return mergeRegister(
      editor.registerUpdateListener(() => {
        updateLinkEditorPosition()
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload) => {
          updateLinkEditorPosition()
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor, updateLinkEditorPosition])

  const focusInput = useCallback((input: HTMLInputElement | null) => {
    if (input) {
      input.focus()
    }
  }, [])

  const handleSubmission = () => {
    if (editedLinkUrl !== '') {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl(editedLinkUrl))
    }
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) {
        return
      }
      const node = getSelectedNode(selection)
      if (!$isLinkTextNode(node, selection)) {
        return
      }
      node.setTextContent(editedLinkText)
    })
    setEditMode(false)
  }

  useEffect(() => {
    setTimeout(updateLinkEditorPosition)
  }, [isEditMode, updateLinkEditorPosition])

  return (
    <Portal>
      <div
        ref={linkEditorRef}
        className="absolute left-0 top-0 z-modal rounded-lg border border-border bg-contrast px-2 py-1 shadow-sm shadow-contrast translucent-ui:border-[--popover-border-color] translucent-ui:bg-[--popover-background-color] translucent-ui:[backdrop-filter:var(--popover-backdrop-filter)] md:opacity-0"
      >
        {isEditMode ? (
          <div className="flex flex-col gap-2 py-1">
            {isLinkText && (
              <div className="flex items-center gap-1.5">
                <Icon type="plain-text" className="flex-shrink-0" />
                <input
                  value={editedLinkText}
                  onChange={(event) => {
                    setEditedLinkText(event.target.value)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === KeyboardKey.Enter) {
                      event.preventDefault()
                      handleSubmission()
                    } else if (event.key === KeyboardKey.Escape) {
                      event.preventDefault()
                      setEditMode(false)
                    }
                  }}
                  className="flex-grow rounded-sm bg-contrast p-1 text-text sm:min-w-[20ch]"
                />
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Icon type="link" className="flex-shrink-0" />
              <input
                ref={focusInput}
                value={editedLinkUrl}
                onChange={(event) => {
                  setEditedLinkUrl(event.target.value)
                }}
                onKeyDown={(event) => {
                  if (event.key === KeyboardKey.Enter) {
                    event.preventDefault()
                    handleSubmission()
                  } else if (event.key === KeyboardKey.Escape) {
                    event.preventDefault()
                    setEditMode(false)
                  }
                }}
                className="flex-grow rounded-sm bg-contrast p-1 text-text sm:min-w-[40ch]"
              />
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <StyledTooltip showOnMobile showOnHover label="Cancel editing">
                <Button
                  onClick={() => {
                    setEditMode(false)
                    editor.focus()
                  }}
                  onMouseDown={(event) => event.preventDefault()}
                >
                  Cancel
                </Button>
              </StyledTooltip>
              <StyledTooltip showOnMobile showOnHover label="Save link">
                <Button primary onClick={handleSubmission} onMouseDown={(event) => event.preventDefault()}>
                  Apply
                </Button>
              </StyledTooltip>
            </div>
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
            <StyledTooltip showOnMobile showOnHover label="Copy link">
              <button
                className="flex select-none items-center justify-center rounded p-2 enabled:hover:bg-default disabled:opacity-50 md:border md:border-transparent enabled:hover:md:translucent-ui:border-[--popover-border-color]"
                onClick={() => {
                  navigator.clipboard.writeText(linkUrl).catch(console.error)
                }}
                onMouseDown={(event) => event.preventDefault()}
              >
                <Icon type="copy" size="medium" />
              </button>
            </StyledTooltip>
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
        )}
      </div>
    </Portal>
  )
}

export default FloatingLinkEditor
