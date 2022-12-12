import { classNames, SortableItem } from '@standardnotes/snjs'
import { ReactNode, useMemo } from 'react'
import Icon from '../Icon/Icon'
import { TableRowModifier, TableRowProps } from './RowModifiers'

type SortBy = keyof SortableItem

export type TableColumn<Data> = {
  name: string
  key: keyof Data
  sortBy?: SortBy
  cell: (data: Data) => ReactNode
}

type TableSortOptions =
  | {
      sortBy: SortBy
      sortReversed: boolean
      onSortChange: (sortBy: SortBy, reversed: boolean) => void
    }
  | {
      sortBy?: never
      sortReversed?: never
      onSortChange?: never
    }

type CreateTableOptions<Data> = {
  data: Data[]
  columns: TableColumn<Data>[]
  rowModifiers?: TableRowModifier<Data>[]
  getRowId?: (data: Data) => string
} & TableSortOptions

type Table<Data> = {
  headers: {
    name: string
    key: keyof Data
    isSorting: boolean | undefined
    sortBy?: SortBy
    sortReversed: boolean | undefined
    onSortChange: () => void
  }[]
  rows: {
    id: string
    modifiedProps?: TableRowProps
    cells: ReactNode[]
  }[]
}

export function useTable<Data>({
  data,
  columns,
  sortBy,
  sortReversed,
  onSortChange,
  rowModifiers,
  getRowId,
}: CreateTableOptions<Data>): Table<Data> {
  const headers = useMemo(
    () =>
      columns.map((column) => {
        return {
          name: column.name,
          key: column.key,
          isSorting: sortBy && sortBy === column.sortBy,
          sortBy: column.sortBy,
          sortReversed: sortReversed,
          onSortChange: () => {
            if (!onSortChange || !column.sortBy) {
              return
            }
            onSortChange(column.sortBy, sortBy === column.sortBy ? !sortReversed : false)
          },
        }
      }),
    [columns, onSortChange, sortBy, sortReversed],
  )

  const rows = useMemo(
    () =>
      data.map((data, index) => {
        const cells = columns.map((column) => {
          return column.cell(data)
        })
        const modifiedProps = rowModifiers?.reduce((props, modifier) => {
          return { ...props, ...modifier(data, props) }
        }, {})
        return {
          id: getRowId ? getRowId(data) : index.toString(),
          cells,
          modifiedProps,
        }
      }),
    [columns, data, getRowId, rowModifiers],
  )

  const table = useMemo(
    () => ({
      headers,
      rows,
    }),
    [headers, rows],
  )

  return table
}

function Table<Data>({ table }: { table: Table<Data> }) {
  return (
    <div className="block min-h-0 overflow-auto">
      <table className="w-full">
        <thead>
          <tr>
            {table.headers.map((header) => {
              return (
                <th
                  className={classNames(
                    'px-3 pt-3 pb-2 text-left text-sm font-medium text-passive-0',
                    header.sortBy && 'cursor-pointer hover:bg-info-backdrop hover:underline',
                  )}
                  onClick={header.onSortChange}
                  key={header.key.toString()}
                >
                  <div className="flex items-center gap-1">
                    {header.name}
                    {header.isSorting && (
                      <Icon
                        type={header.sortReversed ? 'arrow-up' : 'arrow-down'}
                        size="custom"
                        className="h-4.5 w-4.5"
                      />
                    )}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="whitespace-nowrap">
          {table.rows.map((row) => {
            return (
              <tr key={row.id} {...row.modifiedProps}>
                {row.cells.map((cell, index) => {
                  return (
                    <td key={index} className="py-2 px-3">
                      {cell}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default Table
