import { LexicalIconName } from '@/Components/Icon/LexicalIcons'
import { BlockPickerOption } from '../BlockPickerPlugin/BlockPickerOption'

export function GetRemoteImageBlockOption(onSelect: () => void) {
  return new BlockPickerOption('Image from URL', {
    iconName: 'image' as LexicalIconName,
    keywords: ['image', 'url'],
    onSelect: onSelect,
  })
}
