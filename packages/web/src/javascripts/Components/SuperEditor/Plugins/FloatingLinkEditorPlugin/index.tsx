/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { $isAutoLinkNode, $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $findMatchingParent, mergeRegister } from '@lexical/utils'
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_LOW,
  GridSelection,
  LexicalEditor,
  NodeSelection,
  RangeSelection,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { getSelectedNode } from '../../Lexical/Utils/getSelectedNode'
import { sanitizeUrl } from '../../Lexical/Utils/sanitizeUrl'
import { CheckIcon, CloseIcon, PencilFilledIcon, TrashFilledIcon } from '@standardnotes/icons'
import { IconComponent } from '../../Lexical/../Lexical/Theme/IconComponent'
import { getDOMRangeRect } from '../../Lexical/Utils/getDOMRangeRect'
import { KeyboardKey } from '@standardnotes/ui-services'
import Icon from '@/Components/Icon/Icon'
import { getPositionedPopoverStyles } from '@/Components/Popover/GetPositionedPopoverStyles'
import { getAdjustedStylesForNonPortalPopover } from '@/Components/Popover/Utils/getAdjustedStylesForNonPortal'

function FloatingLinkEditor({ editor, anchorElem }: { editor: LexicalEditor; anchorElem: HTMLElement }): JSX.Element {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [editedLinkUrl, setEditedLinkUrl] = useState('')
  const [isEditMode, setEditMode] = useState(false)
  const [lastSelection, setLastSelection] = useState<RangeSelection | GridSelection | NodeSelection | null>(null)

  const updateLinkEditor = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection)
      const parent = node.getParent()
      if ($isLinkNode(parent)) {
        setLinkUrl(parent.getURL())
      } else if ($isLinkNode(node)) {
        setLinkUrl(node.getURL())
      } else {
        setLinkUrl('')
      }
    }
    const editorElem = editorRef.current
    const nativeSelection = window.getSelection()
    const activeElement = document.activeElement

    if (editorElem === null) {
      return
    }

    const rootElement = editor.getRootElement()

    if (
      selection !== null &&
      nativeSelection !== null &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      setLastSelection(selection)

      const rect = getDOMRangeRect(nativeSelection, rootElement)

      const editorRect = editorElem.getBoundingClientRect()
      const rootElementRect = rootElement.getBoundingClientRect()

      const calculatedStyles = getPositionedPopoverStyles({
        align: 'start',
        side: 'top',
        anchorRect: rect,
        popoverRect: editorRect,
        documentRect: rootElementRect,
        offset: 8,
        disableMobileFullscreenTakeover: true,
      })

      if (calculatedStyles) {
        Object.assign(editorElem.style, calculatedStyles)
        const adjustedStyles = getAdjustedStylesForNonPortalPopover(editorElem, calculatedStyles, rootElement)
        editorElem.style.setProperty('--translate-x', adjustedStyles['--translate-x'])
        editorElem.style.setProperty('--translate-y', adjustedStyles['--translate-y'])
      }
    } else if (!activeElement || activeElement.id !== 'link-input') {
      setLastSelection(null)
      setEditMode(false)
    }

    return true
  }, [editor])

  useEffect(() => {
    const scrollerElem = anchorElem.parentElement

    const update = () => {
      editor.getEditorState().read(() => {
        updateLinkEditor()
      })
    }

    window.addEventListener('resize', update)

    if (scrollerElem) {
      scrollerElem.addEventListener('scroll', update)
    }

    return () => {
      window.removeEventListener('resize', update)

      if (scrollerElem) {
        scrollerElem.removeEventListener('scroll', update)
      }
    }
  }, [anchorElem.parentElement, editor, updateLinkEditor])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateLinkEditor()
        })
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateLinkEditor()
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor, updateLinkEditor])

  useEffect(() => {
    editor.getEditorState().read(() => {
      updateLinkEditor()
    })
  }, [editor, updateLinkEditor])

  useEffect(() => {
    if (isEditMode && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditMode])

  const handleLinkSubmission = () => {
    if (lastSelection !== null) {
      if (linkUrl !== '') {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl(editedLinkUrl))
      }
      setEditMode(false)
    }
  }

  return (
    <div
      ref={editorRef}
      className="absolute top-0 left-0 max-w-[100vw] rounded-lg border border-border bg-default py-1 px-2 shadow shadow-contrast md:hidden"
    >
      {isEditMode ? (
        <div className="flex items-center gap-2">
          <input
            id="link-input"
            ref={inputRef}
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
            className="flex-grow rounded-sm bg-contrast p-1 text-text"
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
            className="mr-1 flex flex-grow items-center gap-2 overflow-hidden whitespace-nowrap underline"
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon type="open-in" className="ml-1 flex-shrink-0" />
            <div className="max-w-[35ch] overflow-hidden text-ellipsis">{linkUrl}</div>
          </a>
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
        </div>
      )}
    </div>
  )
}

function useFloatingLinkEditorToolbar(editor: LexicalEditor, anchorElem: HTMLElement): JSX.Element | null {
  const [activeEditor, setActiveEditor] = useState(editor)
  const [isLink, setIsLink] = useState(false)

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection)
      const linkParent = $findMatchingParent(node, $isLinkNode)
      const autoLinkParent = $findMatchingParent(node, $isAutoLinkNode)

      if (linkParent != null && autoLinkParent == null) {
        setIsLink(true)
      } else {
        setIsLink(false)
      }
    }
  }, [])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar()
        })
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, newEditor) => {
          updateToolbar()
          setActiveEditor(newEditor)
          return false
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    )
  }, [editor, updateToolbar])

  return isLink ? createPortal(<FloatingLinkEditor editor={activeEditor} anchorElem={anchorElem} />, anchorElem) : null
}

export default function FloatingLinkEditorPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext()
  return useFloatingLinkEditorToolbar(editor, anchorElem)
}
