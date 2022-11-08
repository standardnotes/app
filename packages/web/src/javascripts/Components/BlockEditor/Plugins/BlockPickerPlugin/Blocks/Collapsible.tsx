import { BlockPickerOption } from '../BlockPickerOption'
import { LexicalEditor } from 'lexical'
import { INSERT_COLLAPSIBLE_COMMAND } from '@standardnotes/blocks-editor/src/Lexical/Plugins/CollapsiblePlugin'

export function GetCollapsibleBlock(editor: LexicalEditor) {
  return new BlockPickerOption('Collapsible', {
    iconName: 'caret-right',
    keywords: ['collapse', 'collapsible', 'toggle'],
    onSelect: () => editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined),
  })
}
