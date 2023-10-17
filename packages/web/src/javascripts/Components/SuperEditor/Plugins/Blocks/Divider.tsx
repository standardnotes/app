import { LexicalEditor } from 'lexical'
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode'
import { BlockPickerOption } from '../BlockPickerPlugin/BlockPickerOption'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'

export const DividerBlock = {
  name: 'Divider',
  iconName: 'horizontal-rule',
  keywords: ['horizontal rule', 'divider', 'hr'],
  onSelect: (editor: LexicalEditor) => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
}

export function GetDividerBlockOption(editor: LexicalEditor) {
  return new BlockPickerOption(DividerBlock.name, {
    iconName: DividerBlock.iconName as LexicalIconName,
    keywords: DividerBlock.keywords,
    onSelect: () => DividerBlock.onSelect(editor),
  })
}
