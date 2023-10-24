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
  COMMAND_PRIORITY_NORMAL,
  FORMAT_TEXT_COMMAND,
  KEY_MODIFIER_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  createCommand,
  $isRootOrShadowRoot,
  ElementFormatType,
  $isElementNode,
  COMMAND_PRIORITY_LOW,
} from 'lexical'
import { mergeRegister, $findMatchingParent, $getNearestNodeOfType } from '@lexical/utils'
import { $isLinkNode, $isAutoLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { $isListNode, ListNode } from '@lexical/list'
import { $isHeadingNode } from '@lexical/rich-text'
import { ComponentPropsWithoutRef, ForwardedRef, forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import { CenterAlignBlock, JustifyAlignBlock, LeftAlignBlock, RightAlignBlock } from '../Blocks/Alignment'
import { BulletedListBlock, ChecklistBlock, NumberedListBlock } from '../Blocks/List'
import { CodeBlock } from '../Blocks/Code'
import { CollapsibleBlock } from '../Blocks/Collapsible'
import { DividerBlock } from '../Blocks/Divider'
import { H1Block, H2Block, H3Block } from '../Blocks/Headings'
import { IndentBlock, OutdentBlock } from '../Blocks/IndentOutdent'
import { ParagraphBlock } from '../Blocks/Paragraph'
import { QuoteBlock } from '../Blocks/Quote'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { classNames } from '@standardnotes/snjs'
import { SUPER_TOGGLE_SEARCH, SUPER_TOGGLE_TOOLBAR } from '@standardnotes/ui-services'
import { useApplication } from '@/Components/ApplicationProvider'
import { InsertRemoteImageDialog } from '../RemoteImagePlugin/RemoteImagePlugin'
import StyledTooltip from '@/Components/StyledTooltip/StyledTooltip'
import { Toolbar, ToolbarItem, useToolbarStore } from '@ariakit/react'
import { PasswordBlock } from '../Blocks/Password'
import LinkEditor from './ToolbarLinkEditor'
import { FOCUSABLE_BUT_NOT_TABBABLE, URL_REGEX } from '@/Constants/Constants'
import LinkTextEditor, { $isLinkTextNode } from './ToolbarLinkTextEditor'
import Popover from '@/Components/Popover/Popover'
import LexicalTableOfContents from '@lexical/react/LexicalTableOfContents'
import Menu from '@/Components/Menu/Menu'
import MenuItem from '@/Components/Menu/MenuItem'
import { remToPx } from '@/Utils'

const TOGGLE_LINK_AND_EDIT_COMMAND = createCommand<string | null>('TOGGLE_LINK_AND_EDIT_COMMAND')

const blockTypeToBlockName = {
  bullet: 'Bulleted List',
  check: 'Check List',
  code: 'Code Block',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
  number: 'Numbered List',
  paragraph: 'Normal',
  quote: 'Quote',
}

interface ToolbarButtonProps extends ComponentPropsWithoutRef<'button'> {
  name: string
  active?: boolean
  iconName: string
  onSelect: () => void
}

const ToolbarButton = forwardRef(
  (
    { name, active, iconName, onSelect, disabled, ...props }: ToolbarButtonProps,
    ref: ForwardedRef<HTMLButtonElement>,
  ) => {
    const [editor] = useLexicalComposerContext()

    return (
      <StyledTooltip showOnMobile showOnHover label={name} side="top">
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
          ref={ref}
          {...props}
        >
          <div
            className={classNames(
              'flex items-center justify-center rounded p-2 transition-colors duration-75',
              active && 'bg-info text-info-contrast',
            )}
          >
            <Icon
              type={iconName}
              size="custom"
              className="h-4 w-4 !text-current md:h-3.5 md:w-3.5 [&>path]:!text-current"
            />
          </div>
        </ToolbarItem>
      </StyledTooltip>
    )
  },
)

const ToolbarPlugin = () => {
  const application = useApplication()
  const isMobile = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  const [modal, showModal] = useModal()

  const [editor] = useLexicalComposerContext()
  const [activeEditor, setActiveEditor] = useState(editor)
  const [isEditable, setIsEditable] = useState(() => editor.isEditable())

  const [blockType, setBlockType] = useState<keyof typeof blockTypeToBlockName>('paragraph')
  const [elementFormat, setElementFormat] = useState<ElementFormatType>('left')

  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [isSubscript, setIsSubscript] = useState(false)
  const [isSuperscript, setIsSuperscript] = useState(false)
  const [isCode, setIsCode] = useState(false)
  const [isHighlight, setIsHighlight] = useState(false)

  const [isLink, setIsLink] = useState(false)
  const [isAutoLink, setIsAutoLink] = useState(false)
  const [isLinkText, setIsLinkText] = useState(false)
  const [isLinkEditMode, setIsLinkEditMode] = useState(false)
  const [isLinkTextEditMode, setIsLinkTextEditMode] = useState(false)
  const [linkText, setLinkText] = useState<string>('')
  const [linkUrl, setLinkUrl] = useState<string>('')

  const [isTOCOpen, setIsTOCOpen] = useState(false)
  const tocAnchorRef = useRef<HTMLButtonElement>(null)

  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode()
      let element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent()
              return parent !== null && $isRootOrShadowRoot(parent)
            })

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow()
      }

      const elementKey = element.getKey()
      const elementDOM = activeEditor.getElementByKey(elementKey)

      // Update text format
      setIsBold(selection.hasFormat('bold'))
      setIsItalic(selection.hasFormat('italic'))
      setIsUnderline(selection.hasFormat('underline'))
      setIsStrikethrough(selection.hasFormat('strikethrough'))
      setIsSubscript(selection.hasFormat('subscript'))
      setIsSuperscript(selection.hasFormat('superscript'))
      setIsCode(selection.hasFormat('code'))
      setIsHighlight(selection.hasFormat('highlight'))

      // Update links
      const node = getSelectedNode(selection)
      const parent = node.getParent()
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true)
      } else {
        setIsLink(false)
      }
      setLinkUrl($isLinkNode(parent) ? parent.getURL() : $isLinkNode(node) ? node.getURL() : '')
      if ($isAutoLinkNode(parent) || $isAutoLinkNode(node)) {
        setIsAutoLink(true)
      } else {
        setIsAutoLink(false)
      }
      if ($isLinkTextNode(node, selection)) {
        setIsLinkText(true)
        setLinkText(node.getTextContent())
      } else {
        setIsLinkText(false)
        setLinkText('')
      }

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode)
          const type = parentList ? parentList.getListType() : element.getListType()
          setBlockType(type)
        } else {
          const type = $isHeadingNode(element) ? element.getTag() : element.getType()
          if (type in blockTypeToBlockName) {
            setBlockType(type as keyof typeof blockTypeToBlockName)
          }
        }
      }

      setElementFormat(($isElementNode(node) ? node.getFormatType() : parent?.getFormatType()) || 'left')
    }
  }, [activeEditor])

  useEffect(() => {
    return mergeRegister(
      editor.registerEditableListener((editable) => {
        setIsEditable(editable)
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, newEditor) => {
          $updateToolbar()
          setActiveEditor(newEditor)
          return false
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    )
  }, [editor, $updateToolbar])

  useEffect(() => {
    return mergeRegister(
      activeEditor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar()
        })
      }),
      activeEditor.registerCommand<boolean>(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload)
          return false
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      activeEditor.registerCommand<boolean>(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload)
          return false
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      activeEditor.registerCommand(
        TOGGLE_LINK_AND_EDIT_COMMAND,
        (payload) => {
          if (payload === null) {
            return activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
          } else if (typeof payload === 'string') {
            const dispatched = activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, payload)
            setLinkUrl(payload)
            setIsLinkEditMode(true)
            return dispatched
          }
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [$updateToolbar, activeEditor])

  useEffect(() => {
    return activeEditor.registerCommand(
      KEY_MODIFIER_COMMAND,
      (payload) => {
        const event: KeyboardEvent = payload
        const { code, ctrlKey, metaKey, shiftKey } = event

        if (code === 'KeyK' && (ctrlKey || metaKey) && !shiftKey) {
          event.preventDefault()
          if ('readText' in navigator.clipboard) {
            navigator.clipboard
              .readText()
              .then((text) => {
                if (URL_REGEX.test(text)) {
                  activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, text)
                } else {
                  throw new Error('Not a valid URL')
                }
              })
              .catch((error) => {
                console.error(error)
                activeEditor.dispatchCommand(TOGGLE_LINK_AND_EDIT_COMMAND, '')
                setIsLinkEditMode(true)
              })
          } else {
            activeEditor.dispatchCommand(TOGGLE_LINK_AND_EDIT_COMMAND, '')
            setIsLinkEditMode(true)
          }
          return true
        }

        return false
      },
      COMMAND_PRIORITY_NORMAL,
    )
  }, [activeEditor, isLink])

  const containerRef = useRef<HTMLDivElement>(null)
  const dismissButtonRef = useRef<HTMLButtonElement>(null)

  const [isFocusInEditor, setIsFocusInEditor] = useState(false)
  const [isFocusInToolbar, setIsFocusInToolbar] = useState(false)
  const isFocusInEditorOrToolbar = isFocusInEditor || isFocusInToolbar
  const [isToolbarVisible, setIsToolbarVisible] = useState(true)
  const canShowToolbar = isMobile ? isFocusInEditorOrToolbar : isToolbarVisible

  useEffect(() => {
    const container = containerRef.current
    const rootElement = editor.getRootElement()

    if (!rootElement) {
      return
    }

    const handleToolbarFocus = () => setIsFocusInToolbar(true)
    const handleToolbarBlur = () => setIsFocusInToolbar(false)

    const handleRootFocus = () => setIsFocusInEditor(true)
    const handleRootBlur = (event: FocusEvent) => {
      const elementToBeFocused = event.relatedTarget as Node
      const containerContainsElementToFocus = container?.contains(elementToBeFocused)
      const willFocusDismissButton = dismissButtonRef.current === elementToBeFocused
      if (containerContainsElementToFocus && !willFocusDismissButton) {
        return
      }
      setIsFocusInEditor(false)
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

  const toolbarRef = useRef<HTMLDivElement>(null)
  const toolbarStore = useToolbarStore()
  useEffect(() => {
    return application.keyboardService.addCommandHandler({
      command: SUPER_TOGGLE_TOOLBAR,
      onKeyDown(event) {
        if (isMobile) {
          return
        }
        event.preventDefault()

        if (!isToolbarVisible) {
          setIsToolbarVisible(true)
          toolbarStore.move(toolbarStore.first())
          return
        }

        const isFocusInContainer = containerRef.current?.contains(document.activeElement)
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
          'md:w-full md:border-b md:border-border md:px-2 md:py-1 md:translucent-ui:border-[--popover-border-color] md:translucent-ui:bg-[--popover-background-color] md:translucent-ui:[backdrop-filter:var(--popover-backdrop-filter)]',
          !canShowToolbar || !isEditable ? 'hidden' : '',
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
              tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
            >
              <LinkEditor
                linkUrl={linkUrl}
                isEditMode={isLinkEditMode}
                setEditMode={setIsLinkEditMode}
                isAutoLink={isAutoLink}
                editor={editor}
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
            className="super-toolbar flex items-center gap-1 overflow-x-auto px-1"
            ref={toolbarRef}
            store={toolbarStore}
          >
            <ToolbarButton
              name="Table of Contents"
              iconName="toc"
              active={isTOCOpen}
              onSelect={() => setIsTOCOpen(!isTOCOpen)}
              ref={tocAnchorRef}
            />
            <ToolbarButton
              name="Undo"
              iconName="undo"
              disabled={!canUndo}
              onSelect={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
            />
            <ToolbarButton
              name="Redo"
              iconName="redo"
              disabled={!canRedo}
              onSelect={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
            />
            <ToolbarButton
              name="Bold"
              iconName="bold"
              active={isBold}
              onSelect={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
            />
            <ToolbarButton
              name="Italic"
              iconName="italic"
              active={isItalic}
              onSelect={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
            />
            <ToolbarButton
              name="Underline"
              iconName="underline"
              active={isUnderline}
              onSelect={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
            />
            <ToolbarButton
              name="Highlight"
              iconName="draw"
              active={isHighlight}
              onSelect={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'highlight')}
            />
            <ToolbarButton
              name="Link"
              iconName="link"
              active={isLink}
              onSelect={() => {
                editor.dispatchCommand(TOGGLE_LINK_AND_EDIT_COMMAND, '')
              }}
            />
            <ToolbarButton
              name="Strikethrough"
              iconName="strikethrough"
              active={isStrikethrough}
              onSelect={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
            />
            <ToolbarButton
              name="Subscript"
              iconName="subscript"
              active={isSubscript}
              onSelect={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript')}
            />
            <ToolbarButton
              name="Superscript"
              iconName="superscript"
              active={isSuperscript}
              onSelect={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript')}
            />
            <ToolbarButton
              name="Inline Code"
              iconName="code-tags"
              active={isCode}
              onSelect={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
            />
            <ToolbarButton
              name="Search"
              iconName="search"
              onSelect={() => application.keyboardService.triggerCommand(SUPER_TOGGLE_SEARCH)}
            />
            <ToolbarButton
              name={ParagraphBlock.name}
              iconName={ParagraphBlock.iconName}
              active={blockType === 'paragraph'}
              onSelect={() => ParagraphBlock.onSelect(editor)}
            />
            <ToolbarButton
              name={H1Block.name}
              iconName={H1Block.iconName}
              active={blockType === 'h1'}
              onSelect={() => H1Block.onSelect(editor)}
            />
            <ToolbarButton
              name={H2Block.name}
              iconName={H2Block.iconName}
              active={blockType === 'h2'}
              onSelect={() => H2Block.onSelect(editor)}
            />
            <ToolbarButton
              name={H3Block.name}
              iconName={H3Block.iconName}
              active={blockType === 'h3'}
              onSelect={() => H3Block.onSelect(editor)}
            />
            <ToolbarButton
              name={IndentBlock.name}
              iconName={IndentBlock.iconName}
              onSelect={() => IndentBlock.onSelect(editor)}
            />
            <ToolbarButton
              name={OutdentBlock.name}
              iconName={OutdentBlock.iconName}
              onSelect={() => OutdentBlock.onSelect(editor)}
            />
            <ToolbarButton
              name={LeftAlignBlock.name}
              iconName={LeftAlignBlock.iconName}
              active={elementFormat === 'left'}
              onSelect={() => LeftAlignBlock.onSelect(editor)}
            />
            <ToolbarButton
              name={CenterAlignBlock.name}
              iconName={CenterAlignBlock.iconName}
              active={elementFormat === 'center'}
              onSelect={() => CenterAlignBlock.onSelect(editor)}
            />
            <ToolbarButton
              name={RightAlignBlock.name}
              iconName={RightAlignBlock.iconName}
              active={elementFormat === 'right'}
              onSelect={() => RightAlignBlock.onSelect(editor)}
            />
            <ToolbarButton
              name={JustifyAlignBlock.name}
              iconName={JustifyAlignBlock.iconName}
              active={elementFormat === 'justify'}
              onSelect={() => JustifyAlignBlock.onSelect(editor)}
            />
            <ToolbarButton
              name={BulletedListBlock.name}
              iconName={BulletedListBlock.iconName}
              active={blockType === 'bullet'}
              onSelect={() => BulletedListBlock.onSelect(editor)}
            />
            <ToolbarButton
              name={NumberedListBlock.name}
              iconName={NumberedListBlock.iconName}
              active={blockType === 'number'}
              onSelect={() => NumberedListBlock.onSelect(editor)}
            />
            <ToolbarButton
              name={ChecklistBlock.name}
              iconName={ChecklistBlock.iconName}
              active={blockType === 'check'}
              onSelect={() => ChecklistBlock.onSelect(editor)}
            />
            <ToolbarButton
              name="Table"
              iconName="table"
              onSelect={() =>
                showModal('Insert Table', (onClose) => <InsertTableDialog activeEditor={editor} onClose={onClose} />)
              }
            />
            <ToolbarButton
              name="Image from URL"
              iconName="image"
              onSelect={() =>
                showModal('Insert image from URL', (onClose) => <InsertRemoteImageDialog onClose={onClose} />)
              }
            />
            <ToolbarButton
              name={CodeBlock.name}
              iconName={CodeBlock.iconName}
              active={blockType === 'code'}
              onSelect={() => CodeBlock.onSelect(editor)}
            />
            <ToolbarButton
              name={QuoteBlock.name}
              iconName={QuoteBlock.iconName}
              active={blockType === 'quote'}
              onSelect={() => QuoteBlock.onSelect(editor)}
            />
            <ToolbarButton
              name={DividerBlock.name}
              iconName={DividerBlock.iconName}
              onSelect={() => DividerBlock.onSelect(editor)}
            />
            <ToolbarButton
              name={CollapsibleBlock.name}
              iconName={CollapsibleBlock.iconName}
              onSelect={() => CollapsibleBlock.onSelect(editor)}
            />
            <ToolbarButton
              name={PasswordBlock.name}
              iconName={PasswordBlock.iconName}
              onSelect={() => PasswordBlock.onSelect(editor)}
            />
          </Toolbar>
          {isMobile && (
            <button
              className="flex flex-shrink-0 items-center justify-center rounded border-l border-border px-3 py-3"
              aria-label="Dismiss keyboard"
              ref={dismissButtonRef}
            >
              <Icon type="keyboard-close" size="medium" />
            </button>
          )}
        </div>
      </div>
      <Popover
        title="Table of contents"
        anchorElement={tocAnchorRef}
        open={isTOCOpen}
        togglePopover={() => setIsTOCOpen(!isTOCOpen)}
        side="top"
        align="center"
        className="py-1"
        disableMobileFullscreenTakeover
        disableFlip
      >
        <div className="mb-1.5 mt-1 px-3 text-sm font-semibold uppercase text-text">Table of Contents</div>
        <LexicalTableOfContents>
          {(tableOfContents) => {
            if (!tableOfContents.length) {
              return <div className="py-2 text-center">No headings found</div>
            }

            return (
              <Menu a11yLabel="Table of contents" isOpen className="!px-0">
                {tableOfContents.map(([key, text, tag]) => {
                  const level = parseInt(tag.slice(1)) || 1
                  if (level > 3) {
                    return null
                  }
                  return (
                    <MenuItem
                      key={key}
                      className="overflow-hidden md:py-2"
                      onClick={() => {
                        editor.getEditorState().read(() => {
                          const domElement = editor.getElementByKey(key)
                          if (!domElement) {
                            return
                          }
                          domElement.scrollIntoView({ block: 'start' })
                          setIsTOCOpen(false)
                        })
                      }}
                      style={{
                        paddingLeft: `${(level - 1) * remToPx(1) + remToPx(0.75)}px`,
                      }}
                    >
                      <Icon type={tag} className="-mt-px mr-2.5 flex-shrink-0" />
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap">{text}</span>
                    </MenuItem>
                  )
                })}
              </Menu>
            )
          }}
        </LexicalTableOfContents>
      </Popover>
    </>
  )
}

export default ToolbarPlugin
