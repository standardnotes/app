import { classNames } from '@standardnotes/snjs'
import { useState } from 'react'
import Icon from '../Icon/Icon'
import { Table, TableRow } from './CommonTypes'

function TableRow<Data>({
  row,
  index: rowIndex,
  canSelectRows,
  handleRowClick,
  handleRowContextMenu,
  handleRowDoubleClick,
}: {
  row: TableRow<Data>
  index: number
  canSelectRows: Table<Data>['canSelectRows']
  handleRowClick: Table<Data>['handleRowClick']
  handleRowContextMenu: Table<Data>['handleRowContextMenu']
  handleRowDoubleClick: Table<Data>['handleRowDoubleClick']
}) {
  const [isHovered, setIsHovered] = useState(false)

  const visibleCells = row.cells.filter((cell) => !cell.hidden)

  return (
    <div
      role="row"
      aria-rowindex={rowIndex + 2}
      className="group relative contents"
      onMouseEnter={() => {
        setIsHovered(true)
      }}
      onMouseLeave={() => {
        setIsHovered(false)
      }}
      onClick={handleRowClick(row.id)}
      onDoubleClick={handleRowDoubleClick(row.id)}
      onContextMenu={handleRowContextMenu(row.id)}
    >
      {visibleCells.map((cell, index, array) => {
        return (
          <div
            role="gridcell"
            aria-rowindex={rowIndex + 2}
            aria-colindex={cell.colIndex + 1}
            key={index}
            className={classNames(
              'relative overflow-hidden border-b border-border py-3 px-3',
              row.isSelected && 'bg-info-backdrop',
              canSelectRows && 'cursor-pointer',
              canSelectRows && isHovered && 'bg-contrast',
            )}
          >
            {cell.render}
            {row.rowActions && index === array.length - 1 && (
              <div
                className={classNames(
                  'absolute right-3 top-1/2 -translate-y-1/2',
                  row.isSelected ? '' : isHovered ? '' : 'invisible',
                )}
              >
                {row.rowActions}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Table<Data>({ table }: { table: Table<Data> }) {
  const {
    headers,
    rows,
    colCount,
    rowCount,
    handleRowClick,
    handleRowContextMenu,
    handleRowDoubleClick,
    selectedRows,
    selectionActions,
    canSelectRows,
    showSelectionActions,
  } = table

  return (
    <div className="block min-h-0 overflow-auto">
      {showSelectionActions && selectedRows.length >= 2 && (
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-info-0 text-sm font-medium">{selectedRows.length} selected</span>
          {selectedRows.length > 0 && selectionActions}
        </div>
      )}
      <div
        className="relative grid w-full overflow-x-hidden px-3"
        role="grid"
        aria-colcount={colCount}
        aria-rowcount={rowCount}
      >
        <div role="row" aria-rowindex={1} className="contents">
          {headers
            .filter((header) => !header.hidden)
            .map((header, index) => {
              return (
                <div
                  role="columnheader"
                  aria-rowindex={1}
                  aria-colindex={header.colIndex + 1}
                  aria-sort={header.isSorting ? (header.sortReversed ? 'descending' : 'ascending') : 'none'}
                  className={classNames(
                    'border-b border-border px-3 pt-3 pb-2 text-left text-sm font-medium text-passive-0',
                    header.sortBy && 'cursor-pointer hover:bg-info-backdrop hover:underline',
                  )}
                  style={{
                    gridColumn: index + 1,
                  }}
                  onClick={header.onSortChange}
                  key={index.toString()}
                >
                  <div className="flex items-center gap-1">
                    {header.name}
                    {header.isSorting && (
                      <Icon
                        type={header.sortReversed ? 'arrow-up' : 'arrow-down'}
                        size="custom"
                        className="h-4.5 w-4.5 text-passive-1"
                      />
                    )}
                  </div>
                </div>
              )
            })}
        </div>
        <div className="contents divide-y divide-border whitespace-nowrap">
          {rows.map((row, index) => (
            <TableRow
              row={row}
              key={row.id}
              index={index}
              canSelectRows={canSelectRows}
              handleRowClick={handleRowClick}
              handleRowContextMenu={handleRowContextMenu}
              handleRowDoubleClick={handleRowDoubleClick}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Table
