import { $isCodeHighlightNode } from '@lexical/code'
import { $isLinkNode, $isAutoLinkNode } from '@lexical/link'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister, $findMatchingParent, $getNearestNodeOfType } from '@lexical/utils'
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  SELECTION_CHANGE_COMMAND,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_CRITICAL,
} from 'lexical'
import { $isHeadingNode } from '@lexical/rich-text'
import { $isListNode, ListNode } from '@lexical/list'
import { useCallback, useEffect, useState } from 'react'
import { getSelectedNode } from '../../Lexical/Utils/getSelectedNode'
import { $isLinkTextNode } from './ToolbarLinkTextEditor'

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

export function useSelectedTextFormatInfo() {
  const [editor] = useLexicalComposerContext()
  const [activeEditor, setActiveEditor] = useState(editor)
  const [isText, setIsText] = useState(false)
  const [isLink, setIsLink] = useState(false)
  const [isAutoLink, setIsAutoLink] = useState(false)
  const [isLinkText, setIsLinkText] = useState(false)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isHighlighted, setIsHighlighted] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [isSubscript, setIsSubscript] = useState(false)
  const [isSuperscript, setIsSuperscript] = useState(false)
  const [isCode, setIsCode] = useState(false)
  const [blockType, setBlockType] = useState<keyof typeof blockTypeToBlockName>('paragraph')

  const updateTextFormatInfo = useCallback(() => {
    editor.getEditorState().read(() => {
      // Should not to pop up the floating toolbar when using IME input
      if (editor.isComposing()) {
        return
      }
      const selection = $getSelection()
      const nativeSelection = window.getSelection()
      const rootElement = editor.getRootElement()

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
      setIsHighlighted(selection.hasFormat('highlight'))

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
      if ($isLinkTextNode(node, selection)) {
        setIsLinkText(true)
      } else {
        setIsLinkText(false)
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
        updateTextFormatInfo()
        return false
      },
      COMMAND_PRIORITY_CRITICAL,
    )
  }, [editor, updateTextFormatInfo])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => {
        updateTextFormatInfo()
      }),
      editor.registerRootListener(() => {
        if (editor.getRootElement() === null) {
          setIsText(false)
        }
      }),
    )
  }, [editor, updateTextFormatInfo])

  return {
    isText,
    isLink,
    isAutoLink,
    isLinkText,
    isBold,
    isItalic,
    isUnderline,
    isStrikethrough,
    isSubscript,
    isSuperscript,
    isHighlighted,
    isCode,
    blockType,
  }
}
