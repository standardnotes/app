/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $isCodeHighlightNode } from '@lexical/code'
import { $isLinkNode, $isAutoLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister, $findMatchingParent, $getNearestNodeOfType } from '@lexical/utils'
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  FORMAT_TEXT_COMMAND,
  LexicalEditor,
  SELECTION_CHANGE_COMMAND,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_LOW,
  RangeSelection,
  GridSelection,
  NodeSelection,
} from 'lexical'
import { $isHeadingNode } from '@lexical/rich-text'
import {
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
  INSERT_ORDERED_LIST_COMMAND,
} from '@lexical/list'
import { ComponentPropsWithoutRef, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { getSelectedNode } from '../../Lexical/Utils/getSelectedNode'
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  CodeIcon,
  LinkIcon,
  SuperscriptIcon,
  SubscriptIcon,
  ListBulleted,
  ListNumbered,
} from '@standardnotes/icons'
import { IconComponent } from '../../Lexical/Theme/IconComponent'
import { sanitizeUrl } from '../../Lexical/Utils/sanitizeUrl'
import { classNames } from '@standardnotes/snjs'
import { getDOMRangeRect } from '../../Lexical/Utils/getDOMRangeRect'
import { getPositionedPopoverStyles } from '@/Components/Popover/GetPositionedPopoverStyles'
import { getAdjustedStylesForNonPortalPopover } from '@/Components/Popover/Utils/getAdjustedStylesForNonPortal'
import LinkEditor from '../FloatingLinkEditorPlugin/LinkEditor'
import { movePopoverToFitInsideRect } from '@/Components/Popover/Utils/movePopoverToFitInsideRect'

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

const IconSize = 15

const ToolbarButton = ({ active, ...props }: { active?: boolean } & ComponentPropsWithoutRef<'button'>) => {
  return (
    <button
      className={classNames(
        'flex rounded-lg p-3 hover:bg-contrast hover:text-text disabled:cursor-not-allowed',
        active && 'bg-info text-info-contrast',
      )}
      {...props}
    >
      {props.children}
    </button>
  )
}

function TextFormatFloatingToolbar({
  editor,
  anchorElem,
  isText,
  isLink,
  isAutoLink,
  isBold,
  isItalic,
  isUnderline,
  isCode,
  isStrikethrough,
  isSubscript,
  isSuperscript,
  isBulletedList,
  isNumberedList,
}: {
  editor: LexicalEditor
  anchorElem: HTMLElement
  isText: boolean
  isBold: boolean
  isCode: boolean
  isItalic: boolean
  isLink: boolean
  isAutoLink: boolean
  isStrikethrough: boolean
  isSubscript: boolean
  isSuperscript: boolean
  isUnderline: boolean
  isBulletedList: boolean
  isNumberedList: boolean
}) {
  const toolbarRef = useRef<HTMLDivElement | null>(null)

  const [linkUrl, setLinkUrl] = useState('')
  const [isLinkEditMode, setIsLinkEditMode] = useState(false)
  const [lastSelection, setLastSelection] = useState<RangeSelection | GridSelection | NodeSelection | null>(null)

  const insertLink = useCallback(() => {
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
  }, [editor, isLink])

  const formatBulletList = useCallback(() => {
    if (!isBulletedList) {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
    }
  }, [editor, isBulletedList])

  const formatNumberedList = useCallback(() => {
    if (!isNumberedList) {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
    }
  }, [editor, isNumberedList])

  const updateToolbar = useCallback(() => {
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

    const toolbarElement = toolbarRef.current

    if (!toolbarElement) {
      return
    }

    const nativeSelection = window.getSelection()
    const activeElement = document.activeElement
    const rootElement = editor.getRootElement()

    if (
      selection !== null &&
      nativeSelection !== null &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      setLastSelection(selection)

      const rangeRect = getDOMRangeRect(nativeSelection, rootElement)
      const toolbarRect = toolbarElement.getBoundingClientRect()
      const rootElementRect = rootElement.getBoundingClientRect()

      const calculatedStyles = getPositionedPopoverStyles({
        align: 'start',
        side: 'top',
        anchorRect: rangeRect,
        popoverRect: toolbarRect,
        documentRect: rootElementRect,
        offset: 12,
        maxHeightFunction: () => 'none',
      })
      if (calculatedStyles) {
        toolbarElement.style.setProperty('--offset', calculatedStyles['--offset'])
      }

      if (calculatedStyles) {
        Object.assign(toolbarElement.style, calculatedStyles)
        const adjustedStyles = getAdjustedStylesForNonPortalPopover(toolbarElement, calculatedStyles, rootElement)
        toolbarElement.style.setProperty('--translate-x', adjustedStyles['--translate-x'])
        toolbarElement.style.setProperty('--translate-y', adjustedStyles['--translate-y'])
        movePopoverToFitInsideRect(toolbarElement, rootElementRect)
      }
    } else if (!activeElement || activeElement.id !== 'link-input') {
      setLastSelection(null)
      setIsLinkEditMode(false)
      setLinkUrl('')
    }

    return true
  }, [editor])

  useEffect(() => {
    const scrollerElem = editor.getRootElement()

    const update = () => {
      editor.getEditorState().read(() => {
        updateToolbar()
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
  }, [editor, anchorElem, updateToolbar])

  useEffect(() => {
    editor.getEditorState().read(() => {
      updateToolbar()
    })
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar()
        })
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar()
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor, updateToolbar])

  useEffect(() => {
    editor.getEditorState().read(() => updateToolbar())
  }, [editor, isLink, isText, updateToolbar])

  if (!editor.isEditable()) {
    return null
  }

  return (
    <div
      ref={toolbarRef}
      className="absolute top-0 left-0 rounded-lg border border-border bg-default py-1 px-2 shadow shadow-contrast"
    >
      {isLink && (
        <LinkEditor
          linkUrl={linkUrl}
          isEditMode={isLinkEditMode}
          setEditMode={setIsLinkEditMode}
          isAutoLink={isAutoLink}
          editor={editor}
          lastSelection={lastSelection}
        />
      )}
      {isText && isLink && <div role="presentation" className="mt-0.5 mb-1.5 h-px bg-border" />}
      {isText && (
        <div className="flex gap-1">
          <ToolbarButton
            active={isBold}
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
            }}
            aria-label="Format text as bold"
          >
            <IconComponent size={IconSize}>
              <BoldIcon />
            </IconComponent>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
            }}
            active={isItalic}
            aria-label="Format text as italics"
          >
            <IconComponent size={IconSize}>
              <ItalicIcon />
            </IconComponent>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
            }}
            active={isUnderline}
            aria-label="Format text to underlined"
          >
            <IconComponent size={IconSize + 1}>
              <UnderlineIcon />
            </IconComponent>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')
            }}
            active={isStrikethrough}
            aria-label="Format text with a strikethrough"
          >
            <IconComponent size={IconSize}>
              <StrikethroughIcon />
            </IconComponent>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript')
            }}
            active={isSubscript}
            title="Subscript"
            aria-label="Format Subscript"
          >
            <IconComponent paddingTop={4} size={IconSize - 2}>
              <SubscriptIcon />
            </IconComponent>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript')
            }}
            active={isSuperscript}
            title="Superscript"
            aria-label="Format Superscript"
          >
            <IconComponent paddingTop={1} size={IconSize - 2}>
              <SuperscriptIcon />
            </IconComponent>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')
            }}
            active={isCode}
            aria-label="Insert code block"
          >
            <IconComponent size={IconSize}>
              <CodeIcon />
            </IconComponent>
          </ToolbarButton>
          <ToolbarButton onClick={insertLink} active={isLink} aria-label="Insert link">
            <IconComponent size={IconSize}>
              <LinkIcon />
            </IconComponent>
          </ToolbarButton>
          <ToolbarButton onClick={formatBulletList} active={isBulletedList} aria-label="Insert bulleted list">
            <IconComponent size={IconSize}>
              <ListBulleted />
            </IconComponent>
          </ToolbarButton>
          <ToolbarButton onClick={formatNumberedList} active={isNumberedList} aria-label="Insert numbered list">
            <IconComponent size={IconSize}>
              <ListNumbered />
            </IconComponent>
          </ToolbarButton>
        </div>
      )}
    </div>
  )
}

function useFloatingTextFormatToolbar(editor: LexicalEditor, anchorElem: HTMLElement): JSX.Element | null {
  const [activeEditor, setActiveEditor] = useState(editor)
  const [isText, setIsText] = useState(false)
  const [isLink, setIsLink] = useState(false)
  const [isAutoLink, setIsAutoLink] = useState(false)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [isSubscript, setIsSubscript] = useState(false)
  const [isSuperscript, setIsSuperscript] = useState(false)
  const [isCode, setIsCode] = useState(false)
  const [blockType, setBlockType] = useState<keyof typeof blockTypeToBlockName>('paragraph')

  const updatePopup = useCallback(() => {
    editor.getEditorState().read(() => {
      // Should not to pop up the floating toolbar when using IME input
      if (editor.isComposing()) {
        return
      }
      const selection = $getSelection()
      const nativeSelection = window.getSelection()
      const rootElement = editor.getRootElement()

      const isMobile = window.matchMedia('(max-width: 768px)').matches

      if (isMobile) {
        return
      }

      if (
        nativeSelection !== null &&
        (!$isRangeSelection(selection) || rootElement === null || !rootElement.contains(nativeSelection.anchorNode))
      ) {
        setIsText(false)
        return
      }

      if (!$isRangeSelection(selection)) {
        return
      }

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

      const node = getSelectedNode(selection)

      // Update text format
      setIsBold(selection.hasFormat('bold'))
      setIsItalic(selection.hasFormat('italic'))
      setIsUnderline(selection.hasFormat('underline'))
      setIsStrikethrough(selection.hasFormat('strikethrough'))
      setIsSubscript(selection.hasFormat('subscript'))
      setIsSuperscript(selection.hasFormat('superscript'))
      setIsCode(selection.hasFormat('code'))

      // Update links
      const parent = node.getParent()
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true)
      } else {
        setIsLink(false)
      }
      if ($isAutoLinkNode(parent) || $isAutoLinkNode(node)) {
        setIsAutoLink(true)
      } else {
        setIsAutoLink(false)
      }

      if (!$isCodeHighlightNode(selection.anchor.getNode()) && selection.getTextContent() !== '') {
        setIsText($isTextNode(node))
      } else {
        setIsText(false)
      }
    })
  }, [editor, activeEditor])

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        setActiveEditor(newEditor)
        updatePopup()
        return false
      },
      COMMAND_PRIORITY_CRITICAL,
    )
  }, [editor, updatePopup])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => {
        updatePopup()
      }),
      editor.registerRootListener(() => {
        if (editor.getRootElement() === null) {
          setIsText(false)
        }
      }),
    )
  }, [editor, updatePopup])

  if (!isText && !isLink) {
    return null
  }

  return createPortal(
    <TextFormatFloatingToolbar
      editor={editor}
      anchorElem={anchorElem}
      isText={isText}
      isLink={isLink}
      isAutoLink={isAutoLink}
      isBold={isBold}
      isItalic={isItalic}
      isStrikethrough={isStrikethrough}
      isSubscript={isSubscript}
      isSuperscript={isSuperscript}
      isUnderline={isUnderline}
      isCode={isCode}
      isBulletedList={blockType === 'bullet'}
      isNumberedList={blockType === 'number'}
    />,
    anchorElem,
  )
}

export default function FloatingTextFormatToolbarPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext()
  return useFloatingTextFormatToolbar(editor, anchorElem)
}
