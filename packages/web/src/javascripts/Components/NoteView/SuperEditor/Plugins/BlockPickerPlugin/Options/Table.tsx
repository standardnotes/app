import { BlockPickerOption } from '../BlockPickerOption'
import { LexicalEditor } from 'lexical'
import { INSERT_TABLE_COMMAND } from '@lexical/table'
import { GetTableBlock } from '../../Blocks/Table'
import { LexicalIconName } from '@/Components/Icon/LexicalIcons'

export function GetTableBlockOption(onSelect: () => void) {
  const block = GetTableBlock(onSelect)
  return new BlockPickerOption(block.name, {
    iconName: block.iconName as LexicalIconName,
    keywords: block.keywords,
    onSelect: block.onSelect,
  })
}

export function GetDynamicTableBlocks(editor: LexicalEditor, queryString: string) {
  const options: Array<BlockPickerOption> = []

  if (queryString == null) {
    return options
  }

  const fullTableRegex = new RegExp(/^([1-9]|10)x([1-9]|10)$/)
  const partialTableRegex = new RegExp(/^([1-9]|10)x?$/)

  const fullTableMatch = fullTableRegex.exec(queryString)
  const partialTableMatch = partialTableRegex.exec(queryString)

  if (fullTableMatch) {
    const [rows, columns] = fullTableMatch[0].split('x').map((n: string) => parseInt(n, 10))

    options.push(
      new BlockPickerOption(`${rows}x${columns} Table`, {
        iconName: 'table',
        keywords: ['table'],
        onSelect: () => editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns: String(columns), rows: String(rows) }),
      }),
    )
  } else if (partialTableMatch) {
    const rows = parseInt(partialTableMatch[0], 10)

    options.push(
      ...Array.from({ length: 5 }, (_, i) => i + 1).map(
        (columns) =>
          new BlockPickerOption(`${rows}x${columns} Table`, {
            iconName: 'table',
            keywords: ['table'],
            onSelect: () =>
              editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns: String(columns), rows: String(rows) }),
          }),
      ),
    )
  }

  return options
}
