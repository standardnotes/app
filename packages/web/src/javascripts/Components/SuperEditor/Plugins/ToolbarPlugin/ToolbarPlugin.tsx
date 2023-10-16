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
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_NORMAL,
  FORMAT_TEXT_COMMAND,
  GridSelection,
  KEY_MODIFIER_COMMAND,
  NodeSelection,
  REDO_COMMAND,
  RangeSelection,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  createCommand,
} from 'lexical'
import { mergeRegister } from '@lexical/utils'
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { ComponentPropsWithoutRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { SUPER_TOGGLE_SEARCH, SUPER_TOGGLE_TOOLBAR } from '@standardnotes/ui-services'
import { useApplication } from '@/Components/ApplicationProvider'
import { GetRemoteImageBlock } from '../Blocks/RemoteImage'
import { InsertRemoteImageDialog } from '../RemoteImagePlugin/RemoteImagePlugin'
import LinkEditor from './ToolbarLinkEditor'
import { FOCUSABLE_BUT_NOT_TABBABLE, URL_REGEX } from '@/Constants/Constants'
import { useSelectedTextFormatInfo } from './useSelectedTextFormatInfo'
import StyledTooltip from '@/Components/StyledTooltip/StyledTooltip'
import LinkTextEditor, { $isLinkTextNode } from './ToolbarLinkTextEditor'
import { Toolbar, ToolbarItem, useToolbarStore } from '@ariakit/react'

const TOGGLE_LINK_AND_EDIT_COMMAND = createCommand<string | null>('TOGGLE_LINK_AND_EDIT_COMMAND')

interface ToolbarButtonProps extends ComponentPropsWithoutRef<'button'> {
  name: string
  active?: boolean
  iconName: string
  onSelect: () => void
}

const ToolbarButton = ({ name, active, iconName, onSelect, disabled, ...props }: ToolbarButtonProps) => {
  const [editor] = useLexicalComposerContext()

  return (
    <StyledTooltip showOnMobile showOnHover label={name}>
      <ToolbarItem
        className="flex select-none items-center justify-center rounded p-0.5 focus:shadow-none focus:outline-none enabled:hover:bg-default enabled:focus-visible:bg-default disabled:opacity-50 md:border md:border-transparent enabled:hover:md:translucent-ui:border-[--popover-border-color]"
        onMouseDown={(event) => {
          event.preventDefault()
          onSelect()
        }}
        onContextMenu={(event) => {
          editor.focus()
          event.preventDefault()
        }}
        disabled={disabled}
        {...props}
      >
        <div
          className={classNames(
            'flex items-center justify-center rounded p-2 transition-colors duration-75',
            active && 'bg-info text-info-contrast',
          )}
        >
          <Icon type={iconName} size="medium" className="!text-current [&>path]:!text-current" />
        </div>
      </ToolbarItem>
    </StyledTooltip>
  )
}

const ToolbarPlugin = () => {
  const application = useApplication()
  const [editor] = useLexicalComposerContext()
  const [modal, showModal] = useModal()

  const [isInEditor, setIsInEditor] = useState(false)
  const [isInToolbar, setIsInToolbar] = useState(false)
  const isMobile = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  const containerRef = useRef<HTMLDivElement>(null)
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

  const {
    isBold,
    isItalic,
    isUnderline,
    isSubscript,
    isSuperscript,
    isStrikethrough,
    blockType,
    isHighlighted,
    isLink,
    isLinkText,
    isAutoLink,
  } = useSelectedTextFormatInfo()

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
      editor.registerCommand(
        TOGGLE_LINK_AND_EDIT_COMMAND,
        (payload) => {
          if (payload === null) {
            return editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
          } else if (typeof payload === 'string') {
            const dispatched = editor.dispatchCommand(TOGGLE_LINK_COMMAND, payload)
            setLinkUrl(payload)
            setIsLinkEditMode(true)
            return dispatched
          }
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_MODIFIER_COMMAND,
        (payload) => {
          const event: KeyboardEvent = payload
          const { code, ctrlKey, metaKey } = event

          if (code === 'KeyK' && (ctrlKey || metaKey)) {
            event.preventDefault()
            if ('readText' in navigator.clipboard) {
              navigator.clipboard
                .readText()
                .then((text) => {
                  if (URL_REGEX.test(text)) {
                    editor.dispatchCommand(TOGGLE_LINK_COMMAND, text)
                  } else {
                    throw new Error('Not a valid URL')
                  }
                })
                .catch((error) => {
                  console.error(error)
                  editor.dispatchCommand(TOGGLE_LINK_AND_EDIT_COMMAND, '')
                  setIsLinkEditMode(true)
                })
            } else {
              editor.dispatchCommand(TOGGLE_LINK_AND_EDIT_COMMAND, '')
              setIsLinkEditMode(true)
            }
            return true
          }

          return false
        },
        COMMAND_PRIORITY_NORMAL,
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
        name: 'Highlight',
        iconName: 'draw',
        onSelect: () => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'highlight')
        },
        active: isHighlighted,
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
        active: isLink,
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
      ...GetAlignmentBlocks(editor),
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
      isHighlighted,
      isItalic,
      isLink,
      isStrikethrough,
      isSubscript,
      isSuperscript,
      isUnderline,
      showModal,
    ],
  )

  useEffect(() => {
    const container = containerRef.current
    const rootElement = editor.getRootElement()

    if (!rootElement) {
      return
    }

    const handleToolbarFocus = () => setIsInToolbar(true)
    const handleToolbarBlur = (event: FocusEvent) => {
      const elementToBeFocused = event.relatedTarget as Node
      if (elementToBeFocused === backspaceButtonRef.current) {
        return
      }
      setIsInToolbar(false)
    }

    const handleRootFocus = () => setIsInEditor(true)
    const handleRootBlur = (event: FocusEvent) => {
      const elementToBeFocused = event.relatedTarget as Node

      const containerContainsElementToFocus = container?.contains(elementToBeFocused)

      const willFocusBackspaceButton = backspaceButtonRef.current && elementToBeFocused === backspaceButtonRef.current

      if (containerContainsElementToFocus || willFocusBackspaceButton) {
        return
      }

      setIsInEditor(false)
    }

    rootElement.addEventListener('focus', handleRootFocus)
    rootElement.addEventListener('blur', handleRootBlur)

    if (container) {
      container.addEventListener('focus', handleToolbarFocus)
      container.addEventListener('blur', handleToolbarBlur)
    }

    return () => {
      rootElement.removeEventListener('focus', handleRootFocus)
      rootElement.removeEventListener('blur', handleRootBlur)
      container?.removeEventListener('focus', handleToolbarFocus)
      container?.removeEventListener('blur', handleToolbarBlur)
    }
  }, [editor])

  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [isLinkEditMode, setIsLinkEditMode] = useState(false)
  const [isLinkTextEditMode, setIsLinkTextEditMode] = useState(false)
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

      if ($isLinkNode(parent)) {
        setLinkUrl(parent.getURL())
      } else if ($isLinkNode(node)) {
        setLinkUrl(node.getURL())
      } else {
        setLinkUrl('')
      }
      if ($isLinkTextNode(node, selection)) {
        setLinkText(node.getTextContent())
      } else {
        setLinkText('')
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

  useEffect(() => {
    const container = containerRef.current
    const rootElement = editor.getRootElement()

    if (!container || !rootElement) {
      return
    }

    const resizeObserver = new ResizeObserver(() => {
      if (isMobile) {
        return
      }

      const containerHeight = container.offsetHeight

      rootElement.style.paddingBottom = containerHeight ? `${containerHeight + 16 * 2}px` : ''
    })

    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [editor, isMobile])

  const isFocusInEditorOrToolbar = isInEditor || isInToolbar
  const [isToolbarVisible, setIsToolbarVisible] = useState(true)
  const canShowToolbar = isMobile ? isFocusInEditorOrToolbar : isToolbarVisible

  const toolbarStore = useToolbarStore()

  useEffect(() => {
    return application.keyboardService.addCommandHandler({
      command: SUPER_TOGGLE_TOOLBAR,
      onKeyDown: (event) => {
        if (isMobile) {
          return
        }

        event.preventDefault()

        const isFocusInContainer = containerRef.current?.contains(document.activeElement)

        if (!isToolbarVisible) {
          setIsToolbarVisible(true)
          toolbarStore.move(toolbarStore.first())
          return
        }

        if (isFocusInContainer) {
          setIsToolbarVisible(false)
          editor.focus()
        } else {
          toolbarStore.move(toolbarStore.first())
        }
      },
    })
  }, [application.keyboardService, editor, isMobile, isToolbarVisible, toolbarStore])

  return (
    <>
      {modal}
      <div
        className={classNames(
          'bg-contrast',
          'md:absolute md:bottom-4 md:left-1/2 md:max-w-[60%] md:-translate-x-1/2 md:rounded-lg md:border md:border-border md:px-2 md:py-1 md:translucent-ui:border-[--popover-border-color] md:translucent-ui:bg-[--popover-background-color] md:translucent-ui:[backdrop-filter:var(--popover-backdrop-filter)]',
          !canShowToolbar ? 'hidden' : '',
        )}
        id="super-mobile-toolbar"
        ref={containerRef}
      >
        {isLinkText && !isAutoLink && (
          <>
            <div className="border-t border-border px-1 py-1 md:border-0 md:px-0 md:py-0">
              <LinkTextEditor
                linkText={linkText}
                editor={editor}
                lastSelection={lastSelection}
                isEditMode={isLinkTextEditMode}
                setEditMode={setIsLinkTextEditMode}
              />
            </div>
            <div
              role="presentation"
              className="my-1 hidden h-px bg-border translucent-ui:bg-[--popover-border-color] md:block"
            />
          </>
        )}
        {isLink && (
          <>
            <div
              className="border-t border-border px-1 py-1 focus:shadow-none focus:outline-none md:border-0 md:px-0 md:py-0"
              ref={linkEditorRef}
              tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
            >
              <LinkEditor
                linkUrl={linkUrl}
                isEditMode={isLinkEditMode}
                setEditMode={setIsLinkEditMode}
                isAutoLink={isAutoLink}
                editor={editor}
                lastSelection={lastSelection}
              />
            </div>
            <div
              role="presentation"
              className="my-1 hidden h-px bg-border translucent-ui:bg-[--popover-border-color] md:block"
            />
          </>
        )}
        <div className="flex w-full flex-shrink-0 border-t border-border md:border-0">
          <Toolbar
            className="flex items-center gap-1 overflow-x-auto pl-1 [&::-webkit-scrollbar]:h-0"
            ref={toolbarRef}
            store={toolbarStore}
          >
            {items.map((item) => {
              return (
                <ToolbarButton
                  name={item.name}
                  iconName={item.iconName}
                  active={item.active}
                  disabled={item.disabled}
                  onSelect={item.onSelect}
                  key={item.name}
                />
              )
            })}
          </Toolbar>
          {isMobile && (
            <button
              className="flex flex-shrink-0 items-center justify-center rounded border-l border-border px-3 py-3"
              aria-label="Dismiss keyboard"
            >
              <Icon type="keyboard-close" size="medium" />
            </button>
          )}
        </div>
      </div>
    </>
  )
}

export default ToolbarPlugin
