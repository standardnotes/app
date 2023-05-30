import Icon from '@/Components/Icon/Icon'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import useModal from '../../Lexical/Hooks/useModal'
import { InsertTableDialog } from '../../Plugins/TablePlugin'
import { getSelectedNode } from '../../Lexical/Utils/getSelectedNode'
import { sanitizeUrl } from '../../Lexical/Utils/sanitizeUrl'
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
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

const MobileToolbarPlugin = () => {
  const application = useApplication()
  const [editor] = useLexicalComposerContext()
  const [modal, showModal] = useModal()

  const [isInEditor, setIsInEditor] = useState(false)
  const [isInToolbar, setIsInToolbar] = useState(false)
  const isMobile = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  const toolbarRef = useRef<HTMLDivElement>(null)
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
        const selection = $getSelection()
        const textContent = selection?.getTextContent()
        if (!textContent) {
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://')
          return
        }
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl(textContent))
      })
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    }
  }, [editor])

  const items = useMemo(
    () => [
      {
        name: 'Bold',
        iconName: 'bold',
        onSelect: () => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
        },
      },
      {
        name: 'Italic',
        iconName: 'italic',
        onSelect: () => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
        },
      },
      {
        name: 'Underline',
        iconName: 'underline',
        onSelect: () => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
        },
      },
      {
        name: 'Strikethrough',
        iconName: 'strikethrough',
        onSelect: () => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')
        },
      },
      {
        name: 'Subscript',
        iconName: 'subscript',
        onSelect: () => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript')
        },
      },
      {
        name: 'Superscript',
        iconName: 'superscript',
        onSelect: () => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript')
        },
      },
      {
        name: 'Link',
        iconName: 'link',
        onSelect: () => {
          editor.update(() => {
            insertLink()
          })
        },
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
      GetNumberedListBlock(editor),
      GetBulletedListBlock(editor),
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
    [application.keyboardService, editor, insertLink, showModal],
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
      const willFocusBackspaceButton = backspaceButtonRef.current && elementToBeFocused === backspaceButtonRef.current
      if (toolbarContainsElementToFocus || willFocusBackspaceButton) {
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
    if (!toolbarRef.current) {
      return
    }

    const toolbar = toolbarRef.current

    const handleFocus = () => setIsInToolbar(true)
    const handleBlur = (event: FocusEvent) => {
      const elementToBeFocused = event.relatedTarget as Node
      if (elementToBeFocused === backspaceButtonRef.current) {
        return
      }
      setIsInToolbar(false)
    }

    toolbar.addEventListener('focus', handleFocus)
    toolbar.addEventListener('blur', handleBlur)

    return () => {
      toolbar?.removeEventListener('focus', handleFocus)
      toolbar?.removeEventListener('blur', handleBlur)
    }
  }, [])

  const isFocusInEditorOrToolbar = isInEditor || isInToolbar
  if (!isMobile || !isFocusInEditorOrToolbar) {
    return null
  }

  return (
    <>
      {modal}
      <div className="flex w-full flex-shrink-0 border-t border-border bg-contrast">
        <div
          tabIndex={-1}
          className={classNames('flex items-center gap-1 overflow-x-auto', '[&::-webkit-scrollbar]:h-0')}
          ref={toolbarRef}
        >
          {items.map((item) => {
            return (
              <button
                className="flex items-center justify-center rounded py-3 px-3"
                aria-label={item.name}
                onClick={item.onSelect}
                key={item.name}
              >
                <Icon type={item.iconName} size="medium" />
              </button>
            )
          })}
        </div>
        <button
          className="flex flex-shrink-0 items-center justify-center rounded border-l border-border py-3 px-3"
          aria-label="Dismiss keyboard"
        >
          <Icon type="keyboard-close" size="medium" />
        </button>
      </div>
    </>
  )
}

export default MobileToolbarPlugin
