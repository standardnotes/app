import { UuidGenerator } from '@standardnotes/snjs'
import { MouseEventHandler, ReactNode, useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { Table, TableColumn, TableHeader, TableRow, TableSortBy } from './CommonTypes'

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
      selectionActions?: (selected: string[]) => ReactNode
      showSelectionActions?: boolean
    }
  | {
      enableRowSelection?: never
      enableMultipleRowSelection?: never
      selectedRowIds?: never
      onRowSelectionChange?: never
      selectionActions?: never
      showSelectionActions?: never
    }

type TableRowOptions<Data> = {
  getRowId?: (data: Data) => string
  onRowActivate?: (data: Data) => void
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
  onRowActivate,
  onRowContextMenu,
  rowActions,
  selectionActions,
  showSelectionActions,
}: UseTableOptions<Data>): Table<Data> {
  const [selectedRows, setSelectedRows] = useState<string[]>(selectedRowIds || [])
  const id = useRef(UuidGenerator.GenerateUuid())

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

  const headers: TableHeader[] = useMemo(
    () =>
      columns.map((column, index) => {
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
          hidden: column.hidden || false,
          colIndex: index,
        }
      }),
    [columns, onSortChange, sortBy, sortReversed],
  )

  const rows: TableRow<Data>[] = useMemo(
    () =>
      data.map((rowData, index) => {
        const cells = columns.map((column, index) => {
          return {
            render: column.cell(rowData),
            hidden: column.hidden || false,
            colIndex: index,
          }
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

  const selectRow = useCallback(
    (id: string) => {
      if (!enableRowSelection) {
        return
      }

      setSelectedRows([id])
    },
    [enableRowSelection],
  )

  const multiSelectRow = useCallback(
    (id: string) => {
      if (!enableRowSelection || !enableMultipleRowSelection) {
        return
      }

      setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
    },
    [enableMultipleRowSelection, enableRowSelection],
  )

  const rangeSelectUpToRow = useCallback(
    (id: string) => {
      if (!enableRowSelection || !enableMultipleRowSelection) {
        return
      }

      const lastSelectedIndex = rows.findIndex((row) => row.id === selectedRows[selectedRows.length - 1])
      const currentIndex = rows.findIndex((row) => row.id === id)
      const start = Math.min(lastSelectedIndex, currentIndex)
      const end = Math.max(lastSelectedIndex, currentIndex)
      const newSelectedRows = rows.slice(start, end + 1).map((row) => row.id)
      setSelectedRows(newSelectedRows)
    },
    [enableMultipleRowSelection, enableRowSelection, rows, selectedRows],
  )

  const handleActivateRow = useCallback(
    (id: string) => {
      if (!onRowActivate) {
        return
      }
      const rowData = rows.find((row) => row.id === id)?.rowData
      if (rowData) {
        onRowActivate(rowData)
      }
    },
    [onRowActivate, rows],
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

  const colCount = useMemo(() => columns.length, [columns])
  const rowCount = useMemo(() => data.length, [data.length])

  const table: Table<Data> = useMemo(
    () => ({
      id: id.current,
      headers,
      rows,
      colCount,
      rowCount,
      selectRow,
      multiSelectRow,
      rangeSelectUpToRow,
      handleActivateRow,
      handleRowContextMenu,
      selectedRows,
      canSelectRows: enableRowSelection || false,
      canSelectMultipleRows: enableMultipleRowSelection || false,
      selectionActions: selectionActions ? selectionActions(selectedRows) : undefined,
      showSelectionActions: showSelectionActions || false,
    }),
    [
      headers,
      rows,
      colCount,
      rowCount,
      selectRow,
      multiSelectRow,
      rangeSelectUpToRow,
      handleActivateRow,
      handleRowContextMenu,
      selectedRows,
      enableRowSelection,
      enableMultipleRowSelection,
      selectionActions,
      showSelectionActions,
    ],
  )

  return table
}
