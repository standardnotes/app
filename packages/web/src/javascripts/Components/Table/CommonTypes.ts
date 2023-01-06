import { SortableItem } from '@standardnotes/snjs'
import { MouseEventHandler, ReactNode } from 'react'

export type TableSortBy = keyof SortableItem

export type TableColumn<Data> = {
  name: string
  sortBy?: TableSortBy
  cell: (data: Data) => ReactNode
  hidden?: boolean
}

type TableCell = {
  render: ReactNode
  hidden: boolean
  colIndex: number
}

export type TableRow<Data> = {
  id: string
  cells: TableCell[]
  isSelected: boolean
  rowData: Data
  rowActions?: ReactNode
}

export type TableHeader = {
  name: string
  isSorting: boolean | undefined
  sortBy?: TableSortBy
  sortReversed: boolean | undefined
  onSortChange: () => void
  hidden: boolean
  colIndex: number
}

export type Table<Data> = {
  id: string
  headers: TableHeader[]
  rows: TableRow<Data>[]
  rowCount: number
  colCount: number
  selectRow: (id: string) => void
  multiSelectRow: (id: string) => void
  rangeSelectUpToRow: (id: string) => void
  handleActivateRow: (id: string) => void
  handleRowContextMenu: (id: string) => MouseEventHandler<HTMLTableRowElement>
  canSelectRows: boolean
  canSelectMultipleRows: boolean
  selectedRows: string[]
  selectionActions: ReactNode | undefined
  showSelectionActions: boolean
}
