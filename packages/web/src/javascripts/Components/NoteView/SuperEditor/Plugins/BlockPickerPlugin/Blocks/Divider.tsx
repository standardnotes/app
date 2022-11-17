import { BlockPickerOption } from '../BlockPickerOption'
import { LexicalEditor } from 'lexical'
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode'

export function GetDividerBlock(editor: LexicalEditor) {
  return new BlockPickerOption('Divider', {
    iconName: 'horizontal-rule',
    keywords: ['horizontal rule', 'divider', 'hr'],
    onSelect: () => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
  })
}
