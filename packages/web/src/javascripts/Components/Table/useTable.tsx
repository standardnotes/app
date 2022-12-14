import { MouseEventHandler, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Table, TableColumn, TableRow, TableSortBy } from './CommonTypes'

type TableSortOptions =
  | {
      sortBy: TableSortBy
      sortReversed: boolean
      onSortChange: (sortBy: TableSortBy, reversed: boolean) => void
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

type TableRowOptions<Data> = {
  getRowId?: (data: Data) => string
  onRowDoubleClick?: (data: Data) => void
  onRowContextMenu?: (x: number, y: number, data: Data) => void
  rowActions?: (data: Data) => ReactNode
}

export type UseTableOptions<Data> = {
  data: Data[]
  columns: TableColumn<Data>[]
} & TableRowOptions<Data> &
  TableSortOptions &
  TableSelectionOptions

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
  onRowContextMenu,
  rowActions,
}: UseTableOptions<Data>): Table<Data> {
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

  const headers = useMemo(
    () =>
      columns.map((column) => {
        return {
          name: column.name,
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
        const row: TableRow<Data> = {
          id,
          isSelected: enableRowSelection ? selectedRows.includes(id) : false,
          cells,
          rowData,
          rowActions: rowActions ? rowActions(rowData) : undefined,
        }
        return row
      }),
    [columns, data, enableRowSelection, getRowId, rowActions, selectedRows],
  )

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

  const handleRowContextMenu = useCallback(
    (id: string) => {
      const handler: MouseEventHandler<HTMLTableRowElement> = (event) => {
        if (!onRowContextMenu) {
          return
        }
        event.preventDefault()
        const rowData = rows.find((row) => row.id === id)?.rowData
        if (rowData) {
          setSelectedRows([id])
          onRowContextMenu(event.clientX, event.clientY, rowData)
        }
      }
      return handler
    },
    [onRowContextMenu, rows],
  )

  const table: Table<Data> = useMemo(
    () => ({
      headers,
      rows,
      handleRowClick,
      handleRowDoubleClick,
      handleRowContextMenu,
      canSelectRows: enableRowSelection || false,
    }),
    [enableRowSelection, handleRowClick, handleRowContextMenu, handleRowDoubleClick, headers, rows],
  )

  return table
}
