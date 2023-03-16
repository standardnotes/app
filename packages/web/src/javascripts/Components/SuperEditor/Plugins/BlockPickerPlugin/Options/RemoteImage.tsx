import { LexicalIconName } from '@/Components/Icon/LexicalIcons'
import { GetRemoteImageBlock } from '../../Blocks/RemoteImage'
import { BlockPickerOption } from '../BlockPickerOption'

export function GetRemoteImageBlockOption(onSelect: () => void) {
  const block = GetRemoteImageBlock(onSelect)
  return new BlockPickerOption(block.name, {
    iconName: block.iconName as LexicalIconName,
    keywords: block.keywords,
    onSelect: block.onSelect,
  })
}
