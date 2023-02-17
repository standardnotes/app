import { BlockPickerOption } from '../BlockPickerOption'
import { LexicalEditor } from 'lexical'
import { GetBulletedListBlock } from '../../Blocks/BulletedList'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'

export function GetBulletedListBlockOption(editor: LexicalEditor) {
  const block = GetBulletedListBlock(editor)
  return new BlockPickerOption(block.name, {
    iconName: block.iconName as LexicalIconName,
    keywords: block.keywords,
    onSelect: block.onSelect,
  })
}
