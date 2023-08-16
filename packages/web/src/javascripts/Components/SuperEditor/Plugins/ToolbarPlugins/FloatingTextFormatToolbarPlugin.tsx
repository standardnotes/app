/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  LexicalEditor,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
  RangeSelection,
  GridSelection,
  NodeSelection,
  KEY_MODIFIER_COMMAND,
  COMMAND_PRIORITY_NORMAL,
  createCommand,
} from 'lexical'
import { INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from '@lexical/list'
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
import { classNames } from '@standardnotes/snjs'
import { getDOMRangeRect } from '../../Lexical/Utils/getDOMRangeRect'
import { getPositionedPopoverStyles } from '@/Components/Popover/GetPositionedPopoverStyles'
import { getAdjustedStylesForNonPortalPopover } from '@/Components/Popover/Utils/getAdjustedStylesForNonPortal'
import LinkEditor from '../LinkEditor/LinkEditor'
import LinkTextEditor, { $isLinkTextNode } from '../LinkEditor/LinkTextEditor'
import { URL_REGEX } from '@/Constants/Constants'
import { useSelectedTextFormatInfo } from './useSelectedTextFormatInfo'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'

const IconSize = 15

const TOGGLE_LINK_AND_EDIT_COMMAND = createCommand<string | null>('TOGGLE_LINK_AND_EDIT_COMMAND')

const ToolbarButton = ({ active, ...props }: { active?: boolean } & ComponentPropsWithoutRef<'button'>) => {
  return (
    <button
      className={classNames(
        'flex rounded-lg p-3 hover:bg-default hover:text-text disabled:cursor-not-allowed',
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
  isLinkText,
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
  isLinkText: boolean
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
  const [linkText, setLinkText] = useState('')
  const [isLinkEditMode, setIsLinkEditMode] = useState(false)
  const [lastSelection, setLastSelection] = useState<RangeSelection | GridSelection | NodeSelection | null>(null)

  useEffect(() => {
    return editor.registerCommand(
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
    )
  }, [editor])

  const insertLink = useCallback(() => {
    if (!isLink) {
      editor.update(() => {
        editor.dispatchCommand(TOGGLE_LINK_AND_EDIT_COMMAND, '')
      })
    } else {
      editor.dispatchCommand(TOGGLE_LINK_AND_EDIT_COMMAND, null)
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
      if ($isLinkTextNode(node, selection)) {
        setLinkText(node.getTextContent())
      } else {
        setLinkText('')
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
    return editor.registerCommand(
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
    )
  }, [editor])

  useEffect(() => {
    editor.getEditorState().read(() => updateToolbar())
  }, [editor, isLink, isText, updateToolbar])

  if (!editor.isEditable()) {
    return null
  }

  return (
    <div
      ref={toolbarRef}
      className="absolute left-0 top-0 rounded-lg border border-border bg-contrast translucent-ui:bg-[--popover-background-color] translucent-ui:[backdrop-filter:var(--popover-backdrop-filter)] translucent-ui:border-[--popover-border-color] px-2 py-1 shadow-sm shadow-contrast"
    >
      {isLinkText && !isAutoLink && (
        <>
          <LinkTextEditor linkText={linkText} editor={editor} lastSelection={lastSelection} />
          <div
            role="presentation"
            className="mb-1.5 mt-0.5 h-px bg-border translucent-ui:bg-[--popover-border-color]"
          />
        </>
      )}
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
      {isText && isLink && (
        <div role="presentation" className="mb-1.5 mt-0.5 h-px bg-border translucent-ui:bg-[--popover-border-color]" />
      )}
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
  const {
    isText,
    isLink,
    isLinkText,
    isAutoLink,
    isBold,
    isItalic,
    isStrikethrough,
    isSubscript,
    isSuperscript,
    isUnderline,
    isCode,
    blockType,
  } = useSelectedTextFormatInfo()

  const isMobile = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  if (isMobile) {
    return null
  }

  if (!isText && !isLink) {
    return null
  }

  return createPortal(
    <TextFormatFloatingToolbar
      editor={editor}
      anchorElem={anchorElem}
      isText={isText}
      isLink={isLink}
      isLinkText={isLinkText}
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
