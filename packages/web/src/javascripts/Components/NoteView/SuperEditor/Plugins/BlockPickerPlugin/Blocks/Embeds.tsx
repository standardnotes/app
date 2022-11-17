import { BlockPickerOption } from '../BlockPickerOption'
import { LexicalEditor } from 'lexical'
import { INSERT_EMBED_COMMAND } from '@lexical/react/LexicalAutoEmbedPlugin'
import { EmbedConfigs } from '@standardnotes/blocks-editor/src/Lexical/Plugins/AutoEmbedPlugin'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'

export function GetEmbedsBlocks(editor: LexicalEditor) {
  return EmbedConfigs.map(
    (embedConfig) =>
      new BlockPickerOption(`Embed ${embedConfig.contentName}`, {
        iconName: embedConfig.iconName as LexicalIconName,
        keywords: [...embedConfig.keywords, 'embed'],
        onSelect: () => editor.dispatchCommand(INSERT_EMBED_COMMAND, embedConfig.type),
      }),
  )
}
