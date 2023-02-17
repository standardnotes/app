import { LexicalEditor } from 'lexical'
import { INSERT_COLLAPSIBLE_COMMAND } from '../../Plugins/CollapsiblePlugin'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'

export function GetCollapsibleBlock(editor: LexicalEditor) {
  return {
    name: 'Collapsible',
    iconName: 'caret-right-fill' as LexicalIconName,
    keywords: ['collapse', 'collapsible', 'toggle'],
    onSelect: () => editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined),
  }
}
