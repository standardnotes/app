import Icon from '@/Components/Icon/Icon'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import useModal from '../../Lexical/Hooks/useModal'
import { InsertTableDialog } from '../TablePlugin'
import { getSelectedNode } from '../../Lexical/Utils/getSelectedNode'
import {
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_TEXT_COMMAND,
  GridSelection,
  NodeSelection,
  REDO_COMMAND,
  RangeSelection,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from 'lexical'
import { mergeRegister } from '@lexical/utils'
import { $isLinkNode, $isAutoLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GetAlignmentBlocks } from '../Blocks/Alignment'
import { GetBulletedListBlock } from '../Blocks/BulletedList'
import { GetChecklistBlock } from '../Blocks/Checklist'
import { GetCodeBlock } from '../Blocks/Code'
import { GetCollapsibleBlock } from '../Blocks/Collapsible'
import { GetDatetimeBlocks } from '../Blocks/DateTime'
import { GetDividerBlock } from '../Blocks/Divider'
import { GetEmbedsBlocks } from '../Blocks/Embeds'
import { GetHeadingsBlocks } from '../Blocks/Headings'
import { GetIndentOutdentBlocks } from '../Blocks/IndentOutdent'
import { GetNumberedListBlock } from '../Blocks/NumberedList'
import { GetParagraphBlock } from '../Blocks/Paragraph'
import { GetPasswordBlock } from '../Blocks/Password'
import { GetQuoteBlock } from '../Blocks/Quote'
import { GetTableBlock } from '../Blocks/Table'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { classNames } from '@standardnotes/snjs'
import { SUPER_TOGGLE_SEARCH } from '@standardnotes/ui-services'
import { useApplication } from '@/Components/ApplicationProvider'
import { GetRemoteImageBlock } from '../Blocks/RemoteImage'
import { InsertRemoteImageDialog } from '../RemoteImagePlugin/RemoteImagePlugin'
import LinkEditor from '../LinkEditor/LinkEditor'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { useSelectedTextFormatInfo } from './useSelectedTextFormatInfo'
import StyledTooltip from '@/Components/StyledTooltip/StyledTooltip'

const MobileToolbarPlugin = () => {
  const application = useApplication()
  const [editor] = useLexicalComposerContext()
  const [modal, showModal] = useModal()

  const [isInEditor, setIsInEditor] = useState(false)
  const [isInLinkEditor, setIsInLinkEditor] = useState(false)
  const [isInToolbar, setIsInToolbar] = useState(false)
  const isMobile = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  const toolbarRef = useRef<HTMLDivElement>(null)
  const linkEditorRef = useRef<HTMLDivElement>(null)
  const backspaceButtonRef = useRef<HTMLButtonElement>(null)

  const insertLink = useCallback(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) {
      return
    }
    const node = getSelectedNode(selection)
    const parent = node.getParent()
    const isLink = $isLinkNode(parent) || $isLinkNode(node)
    if (!isLink) {
      editor.update(() => {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://')
      })
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    }
  }, [editor])

  const { isBold, isItalic, isUnderline, isSubscript, isSuperscript, isStrikethrough, blockType } =
    useSelectedTextFormatInfo()
  const [isSelectionLink, setIsSelectionLink] = useState(false)

  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  useEffect(() => {
    return mergeRegister(
      editor.registerCommand<boolean>(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload)
          return false
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand<boolean>(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload)
          return false
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    )
  }, [editor])

  const items = useMemo(
    (): {
      name: string
      iconName: string
      keywords?: string[]
      active?: boolean
      disabled?: boolean
      onSelect: () => void
    }[] => [
      {
        name: 'Undo',
        iconName: 'undo',
        disabled: !canUndo,
        onSelect: () => {
          editor.dispatchCommand(UNDO_COMMAND, undefined)
        },
      },
      {
        name: 'Redo',
        iconName: 'redo',
        disabled: !canRedo,
        onSelect: () => {
          editor.dispatchCommand(REDO_COMMAND, undefined)
        },
      },
      {
        name: 'Bold',
        iconName: 'bold',
        onSelect: () => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
        },
        active: isBold,
      },
      {
        name: 'Italic',
        iconName: 'italic',
        onSelect: () => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
        },
        active: isItalic,
      },
      {
        name: 'Underline',
        iconName: 'underline',
        onSelect: () => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
        },
        active: isUnderline,
      },
      {
        name: 'Strikethrough',
        iconName: 'strikethrough',
        onSelect: () => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')
        },
        active: isStrikethrough,
      },
      {
        name: 'Subscript',
        iconName: 'subscript',
        onSelect: () => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript')
        },
        active: isSubscript,
      },
      {
        name: 'Superscript',
        iconName: 'superscript',
        onSelect: () => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript')
        },
        active: isSuperscript,
      },
      {
        name: 'Link',
        iconName: 'link',
        onSelect: () => {
          editor.update(() => {
            insertLink()
          })
        },
        active: isSelectionLink,
      },
      {
        name: 'Search',
        iconName: 'search',
        onSelect: () => {
          application.keyboardService.triggerCommand(SUPER_TOGGLE_SEARCH)
        },
      },
      GetParagraphBlock(editor),
      ...GetHeadingsBlocks(editor),
      ...GetIndentOutdentBlocks(editor),
      GetTableBlock(() =>
        showModal('Insert Table', (onClose) => <InsertTableDialog activeEditor={editor} onClose={onClose} />),
      ),
      GetRemoteImageBlock(() => {
        showModal('Insert image from URL', (onClose) => <InsertRemoteImageDialog onClose={onClose} />)
      }),
      GetNumberedListBlock(editor, blockType === 'number'),
      GetBulletedListBlock(editor, blockType === 'bullet'),
      GetChecklistBlock(editor),
      GetQuoteBlock(editor),
      GetCodeBlock(editor),
      GetDividerBlock(editor),
      ...GetDatetimeBlocks(editor),
      ...GetAlignmentBlocks(editor),
      ...[GetPasswordBlock(editor)],
      GetCollapsibleBlock(editor),
      ...GetEmbedsBlocks(editor),
    ],
    [
      application.keyboardService,
      blockType,
      canRedo,
      canUndo,
      editor,
      insertLink,
      isBold,
      isItalic,
      isSelectionLink,
      isStrikethrough,
      isSubscript,
      isSuperscript,
      isUnderline,
      showModal,
    ],
  )

  useEffect(() => {
    const rootElement = editor.getRootElement()

    if (!rootElement) {
      return
    }

    const handleFocus = () => setIsInEditor(true)
    const handleBlur = (event: FocusEvent) => {
      const elementToBeFocused = event.relatedTarget as Node
      const toolbarContainsElementToFocus = toolbarRef.current && toolbarRef.current.contains(elementToBeFocused)
      const linkEditorContainsElementToFocus =
        linkEditorRef.current &&
        (linkEditorRef.current.contains(elementToBeFocused) || elementToBeFocused === linkEditorRef.current)
      const willFocusBackspaceButton = backspaceButtonRef.current && elementToBeFocused === backspaceButtonRef.current
      if (toolbarContainsElementToFocus || linkEditorContainsElementToFocus || willFocusBackspaceButton) {
        return
      }
      setIsInEditor(false)
    }

    rootElement.addEventListener('focus', handleFocus)
    rootElement.addEventListener('blur', handleBlur)

    return () => {
      rootElement.removeEventListener('focus', handleFocus)
      rootElement.removeEventListener('blur', handleBlur)
    }
  }, [editor])

  useEffect(() => {
    const toolbar = toolbarRef.current
    const linkEditor = linkEditorRef.current

    const handleToolbarFocus = () => setIsInToolbar(true)
    const handleLinkEditorFocus = () => setIsInLinkEditor(true)
    const handleToolbarBlur = (event: FocusEvent) => {
      const elementToBeFocused = event.relatedTarget as Node
      if (elementToBeFocused === backspaceButtonRef.current) {
        return
      }
      setIsInToolbar(false)
    }
    const handleLinkEditorBlur = (event: FocusEvent) => {
      const elementToBeFocused = event.relatedTarget as Node
      if (elementToBeFocused === backspaceButtonRef.current) {
        return
      }
      setIsInLinkEditor(false)
    }

    if (toolbar) {
      toolbar.addEventListener('focus', handleToolbarFocus)
      toolbar.addEventListener('blur', handleToolbarBlur)
    }

    if (linkEditor) {
      linkEditor.addEventListener('focus', handleLinkEditorFocus)
      linkEditor.addEventListener('blur', handleLinkEditorBlur)
    }

    return () => {
      toolbar?.removeEventListener('focus', handleToolbarFocus)
      toolbar?.removeEventListener('blur', handleToolbarBlur)
      linkEditor?.removeEventListener('focus', handleLinkEditorFocus)
      linkEditor?.removeEventListener('blur', handleLinkEditorBlur)
    }
  }, [])
  const [isSelectionAutoLink, setIsSelectionAutoLink] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [isLinkEditMode, setIsLinkEditMode] = useState(false)
  const [lastSelection, setLastSelection] = useState<RangeSelection | GridSelection | NodeSelection | null>(null)

  const updateEditorSelection = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection()
      const nativeSelection = window.getSelection()
      const activeElement = document.activeElement
      const rootElement = editor.getRootElement()

      if (!$isRangeSelection(selection)) {
        return
      }

      const node = getSelectedNode(selection)
      const parent = node.getParent()

      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsSelectionLink(true)
      } else {
        setIsSelectionLink(false)
      }

      if ($isAutoLinkNode(parent) || $isAutoLinkNode(node)) {
        setIsSelectionAutoLink(true)
      } else {
        setIsSelectionAutoLink(false)
      }

      if ($isLinkNode(parent)) {
        setLinkUrl(parent.getURL())
      } else if ($isLinkNode(node)) {
        setLinkUrl(node.getURL())
      } else {
        setLinkUrl('')
      }

      if (
        selection !== null &&
        nativeSelection !== null &&
        rootElement !== null &&
        rootElement.contains(nativeSelection.anchorNode)
      ) {
        setLastSelection(selection)
      } else if (!activeElement || activeElement.id !== 'link-input') {
        setLastSelection(null)
        setIsLinkEditMode(false)
        setLinkUrl('')
      }
    })
  }, [editor])

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateEditorSelection()
          return false
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerUpdateListener(() => {
        updateEditorSelection()
      }),
    )
  }, [editor, updateEditorSelection])

  const isFocusInEditorOrToolbar = isInEditor || isInToolbar || isInLinkEditor

  return (
    <>
      {modal}
      <div
        className={classNames('bg-contrast', !isMobile || !isFocusInEditorOrToolbar ? 'hidden' : '')}
        id="super-mobile-toolbar"
      >
        {isSelectionLink && (
          <div
            className="border-t border-border px-2 focus:shadow-none focus:outline-none"
            ref={linkEditorRef}
            tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
          >
            <LinkEditor
              linkUrl={linkUrl}
              isEditMode={isLinkEditMode}
              setEditMode={setIsLinkEditMode}
              isAutoLink={isSelectionAutoLink}
              editor={editor}
              lastSelection={lastSelection}
            />
          </div>
        )}
        <div className="flex w-full flex-shrink-0 border-t border-border bg-contrast">
          <div
            tabIndex={-1}
            className="flex items-center gap-1 overflow-x-auto pl-1 [&::-webkit-scrollbar]:h-0"
            ref={toolbarRef}
          >
            {items.map((item) => {
              return (
                <StyledTooltip showOnMobile showOnHover label={item.name} key={item.name}>
                  <button
                    className="flex select-none items-center justify-center rounded p-0.5 hover:bg-default disabled:opacity-50"
                    aria-label={item.name}
                    onMouseDown={(event) => {
                      event.preventDefault()
                      item.onSelect()
                    }}
                    onContextMenu={(event) => {
                      editor.focus()
                      event.preventDefault()
                    }}
                    disabled={item.disabled}
                  >
                    <div
                      className={classNames(
                        'flex items-center justify-center rounded p-2 transition-colors duration-75',
                        item.active && 'bg-info text-info-contrast',
                      )}
                    >
                      <Icon type={item.iconName} size="medium" className="!text-current [&>path]:!text-current" />
                    </div>
                  </button>
                </StyledTooltip>
              )
            })}
          </div>
          <button
            className="flex flex-shrink-0 items-center justify-center rounded border-l border-border px-3 py-3"
            aria-label="Dismiss keyboard"
          >
            <Icon type="keyboard-close" size="medium" />
          </button>
        </div>
      </div>
    </>
  )
}

export default MobileToolbarPlugin
