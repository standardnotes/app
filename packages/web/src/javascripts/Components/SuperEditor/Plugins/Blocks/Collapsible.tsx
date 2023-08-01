import { LexicalEditor } from 'lexical'
import { INSERT_COLLAPSIBLE_COMMAND } from '../../Plugins/CollapsiblePlugin'
import { IconType } from '@standardnotes/snjs'

export function GetCollapsibleBlock(editor: LexicalEditor) {
  return {
    name: 'Collapsible',
    iconName: 'caret-right' as IconType,
    keywords: ['collapse', 'collapsible', 'toggle'],
    onSelect: () => editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined),
  }
}
