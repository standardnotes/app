import { BlockPickerOption } from '../BlockPickerOption'
import { FORMAT_ELEMENT_COMMAND, LexicalEditor, ElementFormatType } from 'lexical'

export function GetAlignmentBlocks(editor: LexicalEditor) {
  return ['left', 'center', 'right', 'justify'].map(
    (alignment) =>
      new BlockPickerOption(`Align ${alignment}`, {
        iconName: `${alignment}-align`,
        keywords: ['align', 'justify', alignment],
        onSelect: () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment as ElementFormatType),
      }),
  )
}
