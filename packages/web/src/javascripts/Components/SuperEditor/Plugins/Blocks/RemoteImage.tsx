import { LexicalIconName } from '@/Components/Icon/LexicalIcons'
import { BlockPickerOption } from '../BlockPickerPlugin/BlockPickerOption'
import { c } from 'ttag'

export function GetRemoteImageBlockOption(onSelect: () => void) {
  return new BlockPickerOption(c('B3.Notes.EditorToolbar.Action').t`Image from URL`, {
    iconName: 'image' as LexicalIconName,
    keywords: ['image', 'url'],
    onSelect: onSelect,
  })
}
