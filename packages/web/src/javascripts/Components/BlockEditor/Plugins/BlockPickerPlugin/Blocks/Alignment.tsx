import { BlockPickerOption } from '../BlockPickerOption'
import { FORMAT_ELEMENT_COMMAND, LexicalEditor, ElementFormatType } from 'lexical'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'

export function GetAlignmentBlocks(editor: LexicalEditor) {
  return ['left', 'center', 'right', 'justify'].map(
    (alignment) =>
      new BlockPickerOption(`Align ${alignment}`, {
        iconName: `align-${alignment}` as LexicalIconName,
        keywords: ['align', 'justify', alignment],
        onSelect: () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment as ElementFormatType),
      }),
  )
}
