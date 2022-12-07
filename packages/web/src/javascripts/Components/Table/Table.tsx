import { classNames, SortableItem } from '@standardnotes/snjs'
import { ReactNode } from 'react'
import Icon from '../Icon/Icon'

type SortBy = keyof SortableItem

type Column<Data> = {
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
  columns: Column<Data>[]
} & TableSortOptions

type TableState<Data> = {
  headers: {
    name: string
    key: keyof Data
    isSorting: boolean | undefined
    sortBy?: SortBy
    sortReversed: boolean | undefined
    onSortChange: () => void
  }[]
  rows: ReactNode[][]
}

export function createTable<Data>(options: CreateTableOptions<Data>): TableState<Data> {
  const headers = options.columns.map((column) => {
    return {
      name: column.name,
      key: column.key,
      isSorting: options.sortBy && options.sortBy === column.sortBy,
      sortBy: column.sortBy,
      sortReversed: options.sortReversed,
      onSortChange: () => {
        if (!options.onSortChange || !column.sortBy) {
          return
        }
        options.onSortChange(column.sortBy, options.sortBy === column.sortBy ? !options.sortReversed : false)
      },
    }
  })

  const rows = options.data.map((data) => {
    const cells = options.columns.map((column) => {
      return column.cell(data)
    })
    return cells
  })

  return {
    headers,
    rows,
  }
}

function Table<Data>({ table }: { table: TableState<Data> }) {
  return (
    <div className="block min-h-0 overflow-auto px-3">
      <table className="w-full">
        <thead>
          <tr>
            {table.headers.map((header) => {
              return (
                <th
                  className={classNames(
                    'pt-3 pb-2 text-left text-sm font-medium text-passive-0',
                    header.sortBy && 'cursor-pointer',
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
          {table.rows.map((row, index) => {
            return (
              <tr key={index}>
                {row.map((cell) => {
                  return cell
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
