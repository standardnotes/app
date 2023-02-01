import { BlockPickerOption } from '../BlockPickerOption'
import { LexicalEditor } from 'lexical'
import { GetChecklistBlock } from '../../Blocks/Checklist'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'

export function GetChecklistBlockOption(editor: LexicalEditor) {
  const block = GetChecklistBlock(editor)
  return new BlockPickerOption(block.name, {
    iconName: block.iconName as LexicalIconName,
    keywords: block.keywords,
    onSelect: block.onSelect,
  })
}
