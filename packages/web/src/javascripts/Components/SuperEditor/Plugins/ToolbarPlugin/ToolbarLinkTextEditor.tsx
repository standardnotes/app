import Icon from '@/Components/Icon/Icon'
import { KeyboardKey } from '@standardnotes/ui-services'
import { $isRangeSelection, $isTextNode, GridSelection, LexicalEditor, NodeSelection, RangeSelection } from 'lexical'
import { useCallback, useEffect, useRef, useState } from 'react'
import { VisuallyHidden } from '@ariakit/react'
import { getSelectedNode } from '../../Lexical/Utils/getSelectedNode'
import { $isLinkNode } from '@lexical/link'
import StyledTooltip from '@/Components/StyledTooltip/StyledTooltip'

type Props = {
  linkText: string
  editor: LexicalEditor
  lastSelection: RangeSelection | GridSelection | NodeSelection | null
  isEditMode: boolean
  setEditMode: (isEditMode: boolean) => void
}

export const $isLinkTextNode = (node: ReturnType<typeof getSelectedNode>, selection: RangeSelection) => {
  const parent = node.getParent()
  return $isLinkNode(parent) && $isTextNode(node) && selection.anchor.getNode() === selection.focus.getNode()
}

const LinkTextEditor = ({ linkText, editor, isEditMode, setEditMode, lastSelection }: Props) => {
  const [editedLinkText, setEditedLinkText] = useState(() => linkText)
  const editModeContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setEditedLinkText(linkText)
  }, [linkText])

  const focusInput = useCallback((input: HTMLInputElement | null) => {
    if (input) {
      input.focus()
    }
  }, [])

  const handleLinkTextSubmission = () => {
    editor.update(() => {
      if ($isRangeSelection(lastSelection)) {
        const node = getSelectedNode(lastSelection)
        if (!$isLinkTextNode(node, lastSelection)) {
          return
        }
        node.setTextContent(editedLinkText)
      }
    })
    setEditMode(false)
  }

  return isEditMode ? (
    <div className="flex items-center gap-2" ref={editModeContainer}>
      <input
        id="link-input"
        ref={focusInput}
        value={editedLinkText}
        onChange={(event) => {
          setEditedLinkText(event.target.value)
        }}
        onKeyDown={(event) => {
          if (event.key === KeyboardKey.Enter) {
            event.preventDefault()
            handleLinkTextSubmission()
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
        className="flex-grow rounded-sm bg-contrast p-1 text-text sm:min-w-[20ch]"
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
      <StyledTooltip showOnMobile showOnHover label="Save link text">
        <button
          className="flex select-none items-center justify-center rounded p-2 enabled:hover:bg-default disabled:opacity-50 md:border md:border-transparent enabled:hover:md:translucent-ui:border-[--popover-border-color]"
          onClick={handleLinkTextSubmission}
          onMouseDown={(event) => event.preventDefault()}
        >
          <Icon type="check" size="medium" />
        </button>
      </StyledTooltip>
    </div>
  ) : (
    <div className="flex items-center gap-1">
      <Icon type="plain-text" className="ml-1 mr-1 flex-shrink-0" />
      <div className="flex-grow overflow-hidden text-ellipsis whitespace-nowrap">
        <VisuallyHidden>Link text:</VisuallyHidden>
        {linkText}
      </div>
      <StyledTooltip showOnMobile showOnHover label="Edit link text">
        <button
          className="flex select-none items-center justify-center rounded p-2 enabled:hover:bg-default disabled:opacity-50 md:border md:border-transparent enabled:hover:md:translucent-ui:border-[--popover-border-color]"
          onClick={() => {
            setEditedLinkText(linkText)
            setEditMode(true)
          }}
          onMouseDown={(event) => event.preventDefault()}
        >
          <Icon type="pencil-filled" size="medium" />
        </button>
      </StyledTooltip>
    </div>
  )
}

export default LinkTextEditor
