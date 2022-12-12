import { classNames, SortableItem } from '@standardnotes/snjs'
import { MouseEventHandler, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
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

type TableSelectionOptions =
  | {
      enableRowSelection: boolean
      enableMultipleRowSelection?: boolean
      selectedRowIds?: string[]
      onRowSelectionChange?: (rowIds: string[]) => void
    }
  | {
      enableRowSelection?: never
      enableMultipleRowSelection?: never
      selectedRowIds?: never
      onRowSelectionChange?: never
    }

type CreateTableOptions<Data> = {
  data: Data[]
  columns: TableColumn<Data>[]
  getRowId?: (data: Data) => string
  onRowDoubleClick?: (data: Data) => void
} & TableSortOptions &
  TableSelectionOptions

type TableRow<Data> = {
  id: string
  cells: ReactNode[]
  isSelected: boolean
  rowData: Data
}

type Table<Data> = {
  headers: {
    name: string
    key: keyof Data
    isSorting: boolean | undefined
    sortBy?: SortBy
    sortReversed: boolean | undefined
    onSortChange: () => void
  }[]
  rows: TableRow<Data>[]
  handleRowClick: (id: string) => MouseEventHandler<HTMLTableRowElement>
  handleRowDoubleClick: (id: string) => MouseEventHandler<HTMLTableRowElement>
  canSelectRows: boolean
}

export function useTable<Data>({
  data,
  columns,
  sortBy,
  sortReversed,
  onSortChange,
  getRowId,
  enableRowSelection,
  enableMultipleRowSelection,
  selectedRowIds,
  onRowSelectionChange,
  onRowDoubleClick,
}: CreateTableOptions<Data>): Table<Data> {
  const [selectedRows, setSelectedRows] = useState<string[]>(selectedRowIds || [])

  useEffect(() => {
    if (selectedRowIds) {
      setSelectedRows(selectedRowIds)
    }
  }, [selectedRowIds])

  useEffect(() => {
    if (onRowSelectionChange) {
      onRowSelectionChange(selectedRows)
    }
  }, [selectedRows, onRowSelectionChange])

  const handleRowClick = useCallback(
    (id: string) => {
      const handler: MouseEventHandler<HTMLTableRowElement> = (event) => {
        if (!enableRowSelection) {
          return
        }
        if (event.ctrlKey && enableMultipleRowSelection) {
          setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
        } else {
          setSelectedRows([id])
        }
      }
      return handler
    },
    [enableMultipleRowSelection, enableRowSelection],
  )

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

  const rows: TableRow<Data>[] = useMemo(
    () =>
      data.map((rowData, index) => {
        const cells = columns.map((column) => {
          return column.cell(rowData)
        })
        const id = getRowId ? getRowId(rowData) : index.toString()
        return {
          id,
          isSelected: enableRowSelection ? selectedRows.includes(id) : false,
          cells,
          rowData,
        }
      }),
    [columns, data, enableRowSelection, getRowId, selectedRows],
  )

  const handleRowDoubleClick = useCallback(
    (id: string) => {
      const handler: MouseEventHandler<HTMLTableRowElement> = () => {
        if (!onRowDoubleClick) {
          return
        }
        const rowData = rows.find((row) => row.id === id)?.rowData
        if (rowData) {
          onRowDoubleClick(rowData)
        }
      }
      return handler
    },
    [onRowDoubleClick, rows],
  )

  const table: Table<Data> = useMemo(
    () => ({
      headers,
      rows,
      handleRowClick,
      handleRowDoubleClick,
      canSelectRows: enableRowSelection || false,
    }),
    [enableRowSelection, handleRowClick, handleRowDoubleClick, headers, rows],
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
              <tr
                key={row.id}
                className={classNames(
                  row.isSelected && 'bg-info-backdrop',
                  table.canSelectRows && 'cursor-pointer hover:bg-contrast',
                )}
                onClick={table.handleRowClick(row.id)}
                onDoubleClick={table.handleRowDoubleClick(row.id)}
              >
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
