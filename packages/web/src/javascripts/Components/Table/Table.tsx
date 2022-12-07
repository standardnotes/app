import { classNames, SortableItem } from '@standardnotes/snjs'
import { ComponentPropsWithoutRef, ReactNode } from 'react'
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

type RowProps = ComponentPropsWithoutRef<'tr'>

type RowModifier<Data> = (data: Data) => RowProps

type CreateTableOptions<Data> = {
  data: Data[]
  columns: Column<Data>[]
  rowModifiers?: RowModifier<Data>[]
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
  rows: {
    modifiedProps?: RowProps
    cells: ReactNode[]
  }[]
}

export function clickableRowModifier<Data>(onClick: (data: Data) => void): RowModifier<Data> {
  return (data: Data) => ({
    className: 'cursor-pointer hover:bg-info-backdrop',
    onClick: () => onClick(data),
  })
}

export function rowContextMenuModifier<Data>(
  onContextMenu: (posX: number, posY: number, data: Data) => void,
): RowModifier<Data> {
  return (data: Data) => ({
    onContextMenu: (event) => {
      event.preventDefault()
      onContextMenu(event.clientX, event.clientY, data)
    },
  })
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
    const modifiedProps = options.rowModifiers?.reduce((props, modifier) => {
      return { ...props, ...modifier(data) }
    }, {})
    return {
      cells,
      modifiedProps,
    }
  })

  return {
    headers,
    rows,
  }
}

function Table<Data>({ table }: { table: TableState<Data> }) {
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
                    header.sortBy && 'cursor-pointer hover:underline',
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
              <tr key={index} {...row.modifiedProps}>
                {row.cells.map((cell) => {
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
