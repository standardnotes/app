import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  COMMAND_PRIORITY_EDITOR,
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $isParagraphNode,
  LexicalNode,
} from 'lexical'
import { useEffect } from 'react'
import { INSERT_DATETIME_COMMAND } from '../Commands'
import { mergeRegister } from '@lexical/utils'
import { $createHeadingNode } from '@lexical/rich-text'
import { formatDateAndTimeForNote, dateToHoursAndMinutesTimeString } from '@/Utils/DateUtils'
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode'

export default function DatetimePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        INSERT_DATETIME_COMMAND,
        (payload) => {
          const now = new Date()
          const selection = $getSelection()

          if (!$isRangeSelection(selection)) {
            return false
          }

          const focusNode = selection.focus.getNode()
          const focusOffset = selection.focus.offset

          const shouldAddHR = $isParagraphNode(focusNode) && focusOffset === 0

          const shouldAddDate = payload.includes('date')
          const shouldAddTime = payload.includes('time')

          const nodesToInsert: LexicalNode[] = []

          const containingNode = shouldAddHR
            ? $createHeadingNode(payload === 'datetime' ? 'h1' : 'h2')
            : $createParagraphNode()

          if (shouldAddDate) {
            const dateNode = $createTextNode(formatDateAndTimeForNote(now, false))
            dateNode.setFormat('italic')
            containingNode.append(dateNode)
          }

          if (shouldAddTime) {
            const timeNode = $createTextNode(dateToHoursAndMinutesTimeString(now))
            timeNode.toggleFormat('italic')
            if (shouldAddDate) {
              timeNode.toggleFormat('superscript')
            }
            containingNode.append(timeNode)
          }

          containingNode.append($createTextNode(' '))

          nodesToInsert.push(containingNode)

          const newLineNode = $createParagraphNode()
          if (shouldAddHR) {
            nodesToInsert.push(newLineNode)
          }

          selection.insertNodes(nodesToInsert)

          if (shouldAddHR) {
            editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
          }

          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  }, [editor])

  return null
}
