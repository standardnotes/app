import { getPositionedPopoverStyles } from '@/Components/Popover/GetPositionedPopoverStyles'
import {
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  LexicalEditor,
  RangeSelection,
  SELECTION_CHANGE_COMMAND,
  TextNode,
} from 'lexical'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getDOMRangeRect } from '../../Lexical/Utils/getDOMRangeRect'
import { classNames } from '@standardnotes/snjs'
import Icon from '@/Components/Icon/Icon'
import StyledTooltip from '@/Components/StyledTooltip/StyledTooltip'
import { $isLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { mergeRegister } from '@lexical/utils'
import { KeyboardKey } from '@standardnotes/ui-services'
import Button from '@/Components/Button/Button'
import { sanitizeUrl } from '../../Lexical/Utils/sanitizeUrl'
import { getSelectedNode } from '../../Lexical/Utils/getSelectedNode'
import { useElementResize } from '@/Hooks/useElementRect'
import { createPortal } from 'react-dom'
import { ElementIds } from '@/Constants/ElementIDs'
import { getAdjustedStylesForNonPortalPopover } from '@/Components/Popover/Utils/getAdjustedStylesForNonPortal'

export const $isLinkTextNode = (
  node: ReturnType<typeof getSelectedNode>,
  selection: RangeSelection,
): node is TextNode => {
  const parent = node.getParent()
  return (
    $isLinkNode(parent) &&
    parent.getChildrenSize() === 1 &&
    $isTextNode(node) &&
    parent.getFirstChild() === node &&
    selection.anchor.getNode() === selection.focus.getNode()
  )
}

const LinkEditor = ({
  editor,
  setIsEditingLink,
  isMobile,
  linkNode,
  linkTextNode,
}: {
  editor: LexicalEditor
  setIsEditingLink: (isEditMode: boolean) => void
  isMobile: boolean
  linkNode: LinkNode | null
  linkTextNode: TextNode | null
}) => {
  const [url, setURL] = useState('')
  const [text, setText] = useState('')
  useEffect(() => {
    editor.getEditorState().read(() => {
      if (linkNode) {
        setURL(linkNode.getURL())
      }
      if (linkTextNode) {
        setText(linkTextNode.getTextContent())
      }
    })
  }, [editor, linkNode, linkTextNode])

  const linkInputRef = useRef<HTMLInputElement>(null)
  const linkEditorRef = useRef<HTMLDivElement>(null)
  const rangeRect = useRef<DOMRect>()
  const positionUpdateRAF = useRef<number>()

  const updateLinkEditorPosition = useCallback(() => {
    if (positionUpdateRAF.current) {
      cancelAnimationFrame(positionUpdateRAF.current)
    }

    positionUpdateRAF.current = requestAnimationFrame(() => {
      if (isMobile) {
        linkInputRef.current?.focus()
        return
      }

      const nativeSelection = window.getSelection()
      const rootElement = editor.getRootElement()

      if (nativeSelection !== null && rootElement !== null) {
        if (rootElement.contains(nativeSelection.anchorNode)) {
          rangeRect.current = getDOMRangeRect(nativeSelection, rootElement)
        }
      }

      const linkEditorElement = linkEditorRef.current

      if (!linkEditorElement) {
        setTimeout(updateLinkEditorPosition)
        return
      }

      if (!rootElement) {
        return
      }

      if (!rangeRect.current) {
        return
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
        const adjustedStyles = getAdjustedStylesForNonPortalPopover(linkEditorElement, calculatedStyles)
        Object.entries(adjustedStyles).forEach(([key, value]) => {
          linkEditorElement.style.setProperty(key, value)
        })
        linkEditorElement.style.display = 'block'
        linkInputRef.current?.focus()
      }
    })
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

  const handleSubmission = () => {
    if (url !== '') {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl(url))
    }
    if (linkTextNode !== null && text !== '') {
      editor.update(
        () => {
          linkTextNode.setTextContent(text)
        },
        {
          discrete: true,
        },
      )
    }
    setIsEditingLink(false)
  }

  useEffect(() => {
    const linkEditor = linkEditorRef.current
    if (!linkEditor) {
      return
    }

    const handleFocusOut = (event: FocusEvent) => {
      if (!linkEditor.contains(event.relatedTarget as Node)) {
        setIsEditingLink(false)
      }
    }

    linkEditor.addEventListener('focusout', handleFocusOut)

    return () => {
      linkEditor.removeEventListener('focusout', handleFocusOut)
    }
  }, [setIsEditingLink])

  return createPortal(
    <div
      className={classNames(
        'absolute z-dropdown-menu rounded-lg border border-border bg-contrast px-2 py-1 shadow-sm shadow-contrast',
        isMobile
          ? 'bottom-12 left-1/2 w-[calc(100%_-_1rem)] -translate-x-1/2'
          : 'left-0 top-0 hidden w-auto translate-x-0 translucent-ui:border-[--popover-border-color] translucent-ui:bg-[--popover-background-color] translucent-ui:[backdrop-filter:var(--popover-backdrop-filter)]',
      )}
      ref={linkEditorRef}
    >
      <div className="flex flex-col gap-2 py-1">
        {linkTextNode && (
          <div className="flex items-center gap-1.5">
            <Icon type="plain-text" className="flex-shrink-0" />
            <input
              value={text}
              onChange={(event) => {
                setText(event.target.value)
              }}
              onKeyDown={(event) => {
                if (event.key === KeyboardKey.Enter) {
                  event.preventDefault()
                  handleSubmission()
                } else if (event.key === KeyboardKey.Escape) {
                  event.preventDefault()
                  setIsEditingLink(false)
                }
              }}
              className="flex-grow rounded-sm border border-border bg-contrast p-1 text-text sm:min-w-[20ch] translucent-ui:md:border-0"
            />
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Icon type="link" className="flex-shrink-0" />
          <input
            ref={linkInputRef}
            value={url}
            onChange={(event) => {
              setURL(event.target.value)
            }}
            onKeyDown={(event) => {
              if (event.key === KeyboardKey.Enter) {
                event.preventDefault()
                handleSubmission()
              } else if (event.key === KeyboardKey.Escape) {
                event.preventDefault()
                setIsEditingLink(false)
              }
            }}
            className="flex-grow rounded-sm border border-border bg-contrast p-1 text-text sm:min-w-[40ch] translucent-ui:md:border-0"
          />
        </div>
        <div className="flex items-center justify-end gap-1.5">
          <StyledTooltip showOnMobile showOnHover label="Cancel editing">
            <Button
              onClick={() => {
                setIsEditingLink(false)
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
    </div>,
    document.getElementById(ElementIds.SuperEditor) ?? document.body,
  )
}

export default LinkEditor
