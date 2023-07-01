/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $isCodeHighlightNode } from '@lexical/code'
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
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
  TrashFilledIcon,
  PencilFilledIcon,
  CloseIcon,
} from '@standardnotes/icons'
import { IconComponent } from '../../Lexical/Theme/IconComponent'
import { sanitizeUrl } from '../../Lexical/Utils/sanitizeUrl'
import { classNames } from '@standardnotes/snjs'
import Icon from '@/Components/Icon/Icon'
import { KeyboardKey } from '@standardnotes/ui-services'

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
  isLink,
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
  isBold: boolean
  isCode: boolean
  isItalic: boolean
  isLink: boolean
  isStrikethrough: boolean
  isSubscript: boolean
  isSuperscript: boolean
  isUnderline: boolean
  isBulletedList: boolean
  isNumberedList: boolean
}) {
  const popupCharStylesEditorRef = useRef<HTMLDivElement | null>(null)

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
    } else if (!activeElement || activeElement.id !== 'link-input') {
      setLastSelection(null)
      setIsLinkEditMode(false)
      setLinkUrl('')
    }

    return true
  }, [editor])

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

  const focusInput = useCallback((input: HTMLInputElement | null) => {
    if (input) {
      input.focus()
    }
  }, [])

  if (!editor.isEditable()) {
    return null
  }

  return (
    <div
      ref={popupCharStylesEditorRef}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-border bg-default py-1 px-2 drop-shadow-sm"
    >
      {isLink && (
        <>
          {isLinkEditMode ? (
            <div className="flex items-center gap-2">
              <input
                id="link-input"
                ref={focusInput}
                value={linkUrl}
                onChange={(event) => {
                  setLinkUrl(event.target.value)
                }}
                onKeyDown={(event) => {
                  if (event.key === KeyboardKey.Enter) {
                    event.preventDefault()
                    if (lastSelection !== null) {
                      if (linkUrl !== '') {
                        editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl(linkUrl))
                      }
                      setIsLinkEditMode(false)
                    }
                  } else if (event.key === KeyboardKey.Escape) {
                    event.preventDefault()
                    setIsLinkEditMode(false)
                  }
                }}
                className="flex-grow rounded-sm bg-contrast p-1 text-text"
              />
              <ToolbarButton
                onClick={() => {
                  setIsLinkEditMode(false)
                }}
                aria-label="Cancel editing link"
              >
                <IconComponent size={IconSize}>
                  <CloseIcon />
                </IconComponent>
              </ToolbarButton>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <a
                className="flex flex-grow items-center gap-2 underline"
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon type="open-in" />
                {linkUrl}
              </a>
              <ToolbarButton
                onClick={() => {
                  setIsLinkEditMode(true)
                }}
                aria-label="Edit link"
              >
                <IconComponent size={IconSize}>
                  <PencilFilledIcon />
                </IconComponent>
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {
                  editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
                }}
                aria-label="Remove link"
              >
                <IconComponent size={IconSize}>
                  <TrashFilledIcon />
                </IconComponent>
              </ToolbarButton>
            </div>
          )}
          <div role="presentation" className="my-1 h-px bg-border" />
        </>
      )}
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
    </div>
  )
}

function useFloatingTextFormatToolbar(editor: LexicalEditor, anchorElem: HTMLElement): JSX.Element | null {
  const [activeEditor, setActiveEditor] = useState(editor)
  const [isText, setIsText] = useState(false)
  const [isLink, setIsLink] = useState(false)
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

  if (!isText) {
    return null
  }

  return createPortal(
    <TextFormatFloatingToolbar
      editor={editor}
      anchorElem={anchorElem}
      isLink={isLink}
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
