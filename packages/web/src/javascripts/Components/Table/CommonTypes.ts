import { SortableItem } from '@standardnotes/snjs'
import { MouseEventHandler, ReactNode } from 'react'

export type TableSortBy = keyof SortableItem

export type TableColumn<Data> = {
  name: string
  sortBy?: TableSortBy
  cell: (data: Data) => ReactNode
}

export type TableRow<Data> = {
  id: string
  cells: ReactNode[]
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
}

export type Table<Data> = {
  headers: TableHeader[]
  rows: TableRow<Data>[]
  handleRowClick: (id: string) => MouseEventHandler<HTMLTableRowElement>
  handleRowDoubleClick: (id: string) => MouseEventHandler<HTMLTableRowElement>
  handleRowContextMenu: (id: string) => MouseEventHandler<HTMLTableRowElement>
  canSelectRows: boolean
}
