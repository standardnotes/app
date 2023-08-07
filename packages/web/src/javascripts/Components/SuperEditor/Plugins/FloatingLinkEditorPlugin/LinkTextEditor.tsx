import Icon from '@/Components/Icon/Icon'
import { CloseIcon, CheckIcon, PencilFilledIcon } from '@standardnotes/icons'
import { KeyboardKey } from '@standardnotes/ui-services'
import { IconComponent } from '../../Lexical/Theme/IconComponent'
import { $isRangeSelection, $isTextNode, GridSelection, LexicalEditor, NodeSelection, RangeSelection } from 'lexical'
import { useCallback, useEffect, useRef, useState } from 'react'
import { VisuallyHidden } from '@ariakit/react'
import { getSelectedNode } from '../../Lexical/Utils/getSelectedNode'
import { $isLinkNode } from '@lexical/link'

type Props = {
  linkText: string
  editor: LexicalEditor
  lastSelection: RangeSelection | GridSelection | NodeSelection | null
}

export const $isLinkTextNode = (node: ReturnType<typeof getSelectedNode>, selection: RangeSelection) => {
  const parent = node.getParent()
  return $isLinkNode(parent) && $isTextNode(node) && selection.anchor.getNode() === selection.focus.getNode()
}

const LinkTextEditor = ({ linkText, editor, lastSelection }: Props) => {
  const [editedLinkText, setEditedLinkText] = useState(() => linkText)
  const [isEditMode, setEditMode] = useState(false)
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
        onClick={handleLinkTextSubmission}
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
      <Icon type="plain-text" className="ml-1 mr-1 flex-shrink-0" />
      <div className="flex-grow max-w-[35ch] overflow-hidden text-ellipsis whitespace-nowrap">
        <VisuallyHidden>Link text:</VisuallyHidden>
        {linkText}
      </div>
      <button
        className="flex rounded-lg p-3 hover:bg-contrast hover:text-text disabled:cursor-not-allowed ml-auto"
        onClick={() => {
          setEditedLinkText(linkText)
          setEditMode(true)
        }}
        aria-label="Edit link"
        onMouseDown={(event) => event.preventDefault()}
      >
        <IconComponent size={15}>
          <PencilFilledIcon />
        </IconComponent>
      </button>
    </div>
  )
}

export default LinkTextEditor
