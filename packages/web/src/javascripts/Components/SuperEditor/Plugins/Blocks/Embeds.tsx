import { LexicalEditor } from 'lexical'
import { INSERT_EMBED_COMMAND } from '@lexical/react/LexicalAutoEmbedPlugin'
import { EmbedConfigs } from '../AutoEmbedPlugin'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'
import { BlockPickerOption } from '../BlockPickerPlugin/BlockPickerOption'

export function GetEmbedsBlocks(editor: LexicalEditor) {
  return EmbedConfigs.map((embedConfig) => ({
    name: `Embed ${embedConfig.contentName}`,
    iconName: embedConfig.iconName as LexicalIconName,
    keywords: [...embedConfig.keywords, 'embed'],
    onSelect: () => editor.dispatchCommand(INSERT_EMBED_COMMAND, embedConfig.type),
  }))
}

export function GetEmbedsBlockOptions(editor: LexicalEditor) {
  return GetEmbedsBlocks(editor).map(
    (block) =>
      new BlockPickerOption(block.name, {
        iconName: block.iconName as LexicalIconName,
        keywords: block.keywords,
        onSelect: block.onSelect,
      }),
  )
}
