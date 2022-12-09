import { classNames, SortableItem } from '@standardnotes/snjs'
import { ComponentPropsWithoutRef, ReactNode, useMemo } from 'react'
import Icon from '../Icon/Icon'

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

type RowProps = ComponentPropsWithoutRef<'tr'>

export type TableRowModifier<Data> = (data: Data, existingProps: RowProps) => RowProps

type CreateTableOptions<Data> = {
  data: Data[]
  columns: TableColumn<Data>[]
  rowModifiers?: TableRowModifier<Data>[]
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

export function rowStyleModifier<Data>(className: string): TableRowModifier<Data> {
  return (_data, existingProps) => ({
    className: existingProps.className ? classNames(existingProps.className, className) : className,
  })
}

export function clickableRowModifier<Data>(onClick: (data: Data) => void): TableRowModifier<Data> {
  const className = 'cursor-pointer hover:bg-info-backdrop'
  return (data: Data, existingProps: RowProps) => ({
    className: existingProps.className ? classNames(existingProps.className, className) : className,
    onClick: () => onClick(data),
  })
}

export function rowContextMenuModifier<Data>(
  onContextMenu: (posX: number, posY: number, data: Data) => void,
): TableRowModifier<Data> {
  return (data: Data) => ({
    onContextMenu: (event) => {
      event.preventDefault()
      onContextMenu(event.clientX, event.clientY, data)
    },
  })
}

export function useTable<Data>({
  data,
  columns,
  sortBy,
  sortReversed,
  onSortChange,
  rowModifiers,
}: CreateTableOptions<Data>): TableState<Data> {
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
      data.map((data) => {
        const cells = columns.map((column) => {
          return column.cell(data)
        })
        const modifiedProps = rowModifiers?.reduce((props, modifier) => {
          return { ...props, ...modifier(data, props) }
        }, {})
        return {
          cells,
          modifiedProps,
        }
      }),
    [columns, data, rowModifiers],
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
