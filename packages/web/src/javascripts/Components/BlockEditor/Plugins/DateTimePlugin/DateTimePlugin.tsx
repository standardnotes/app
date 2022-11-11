import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  COMMAND_PRIORITY_EDITOR,
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
} from 'lexical'
import { useEffect } from 'react'
import { INSERT_DATETIME_COMMAND, INSERT_TIME_COMMAND, INSERT_DATE_COMMAND } from '../Commands'
import { mergeRegister } from '@lexical/utils'
import { $createHeadingNode } from '@lexical/rich-text'
import { formatDateAndTimeForNote, dateToHoursAndMinutesTimeString } from '@/Utils/DateUtils'
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode'

export default function DatetimePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand<string>(
        INSERT_DATETIME_COMMAND,
        () => {
          const now = new Date()
          const selection = $getSelection()

          if (!$isRangeSelection(selection)) {
            return false
          }

          const heading = $createHeadingNode('h1')
          const dateString = $createTextNode(formatDateAndTimeForNote(now, false))
          dateString.setFormat('italic')
          heading.append(dateString)

          const timeNode = $createTextNode(dateToHoursAndMinutesTimeString(now))
          timeNode.toggleFormat('superscript')
          timeNode.toggleFormat('italic')
          heading.append(timeNode)

          const newLineNode = $createParagraphNode()

          selection.insertNodes([heading, newLineNode])

          editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)

          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand<string>(
        INSERT_DATE_COMMAND,
        () => {
          const now = new Date()
          const selection = $getSelection()

          if (!$isRangeSelection(selection)) {
            return false
          }

          const heading = $createHeadingNode('h1')
          const dateString = $createTextNode(formatDateAndTimeForNote(now, false))
          dateString.setFormat('italic')
          heading.append(dateString)

          const newLineNode = $createParagraphNode()

          selection.insertNodes([heading, newLineNode])

          editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)

          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand<string>(
        INSERT_TIME_COMMAND,
        () => {
          const now = new Date()
          const selection = $getSelection()

          if (!$isRangeSelection(selection)) {
            return false
          }

          const heading = $createHeadingNode('h2')
          const dateString = $createTextNode(dateToHoursAndMinutesTimeString(now))
          dateString.setFormat('italic')
          heading.append(dateString)

          const newLineNode = $createParagraphNode()

          selection.insertNodes([heading, newLineNode])

          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  }, [editor])

  return null
}
