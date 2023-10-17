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
  $isRootOrShadowRoot,
  ElementFormatType,
  $isElementNode,
} from 'lexical'
import { mergeRegister, $findMatchingParent, $getNearestNodeOfType } from '@lexical/utils'
import { $isLinkNode, $isAutoLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { $isListNode, ListNode } from '@lexical/list'
import { $isHeadingNode } from '@lexical/rich-text'
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
import StyledTooltip from '@/Components/StyledTooltip/StyledTooltip'
import LinkTextEditor, { $isLinkTextNode } from './ToolbarLinkTextEditor'
import { Toolbar, ToolbarItem, useToolbarStore } from '@ariakit/react'

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
  const [activeEditor, setActiveEditor] = useState(editor)
  const [blockType, setBlockType] = useState<keyof typeof blockTypeToBlockName>('paragraph')
  const [elementFormat, setElementFormat] = useState<ElementFormatType>('left')
  const [isLink, setIsLink] = useState(false)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [isSubscript, setIsSubscript] = useState(false)
  const [isSuperscript, setIsSuperscript] = useState(false)
  const [isCode, setIsCode] = useState(false)
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

      // Update links
      const node = getSelectedNode(selection)
      const parent = node.getParent()
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true)
      } else {
        setIsLink(false)
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
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        $updateToolbar()
        setActiveEditor(newEditor)
        return false
      },
      COMMAND_PRIORITY_CRITICAL,
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
    )
  }, [$updateToolbar, activeEditor, editor])

  useEffect(() => {
    return activeEditor.registerCommand(
      KEY_MODIFIER_COMMAND,
      (payload) => {
        const event: KeyboardEvent = payload
        const { code, ctrlKey, metaKey } = event

        if (code === 'KeyK' && (ctrlKey || metaKey)) {
          event.preventDefault()
          // if (!isLink) {
          //   setIsLinkEditMode(true)
          // } else {
          //   setIsLinkEditMode(false)
          // }
          return activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, '')
        }
        return false
      },
      COMMAND_PRIORITY_NORMAL,
    )
  }, [activeEditor, isLink])

  return (
    <>
      {/* modal */}
      <div
        className={classNames(
          'bg-contrast',
          'md:absolute md:bottom-4 md:left-1/2 md:max-w-[60%] md:-translate-x-1/2 md:rounded-lg md:border md:border-border md:px-2 md:py-1 md:translucent-ui:border-[--popover-border-color] md:translucent-ui:bg-[--popover-background-color] md:translucent-ui:[backdrop-filter:var(--popover-backdrop-filter)]',
          // !canShowToolbar ? 'hidden' : '',
        )}
        id="super-mobile-toolbar"
        // ref={containerRef}
      >
        {/* isLinkText && !isAutoLink && (
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
        ) */}
        {/* isLink && (
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
        ) */}
        <div className="flex w-full flex-shrink-0 border-t border-border md:border-0">
          <Toolbar
            className="flex items-center gap-1 overflow-x-auto pl-1 [&::-webkit-scrollbar]:h-0"
            // ref={toolbarRef}
            // store={toolbarStore}
          >
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
            {/* items.map((item) => {
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
            }) */}
          </Toolbar>
          {/* isMobile && (
            <button
              className="flex flex-shrink-0 items-center justify-center rounded border-l border-border px-3 py-3"
              aria-label="Dismiss keyboard"
            >
              <Icon type="keyboard-close" size="medium" />
            </button>
          ) */}
        </div>
      </div>
    </>
  )
}

export default ToolbarPlugin
