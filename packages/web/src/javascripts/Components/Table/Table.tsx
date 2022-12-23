import { classNames } from '@standardnotes/snjs'
import Icon from '../Icon/Icon'
import { Table } from './CommonTypes'

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
      <table className="w-full" role="grid" aria-colcount={colCount} aria-rowcount={rowCount}>
        <thead>
          <tr>
            {headers.map((header, index) => {
              if (header.hidden) {
                return null
              }

              return (
                <th
                  className={classNames(
                    'border-b border-border px-3 pt-3 pb-2 text-left text-sm font-medium text-passive-0',
                    header.sortBy && 'cursor-pointer hover:bg-info-backdrop hover:underline',
                  )}
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
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-border whitespace-nowrap">
          {rows.map((row) => {
            return (
              <tr
                key={row.id}
                className={classNames(
                  'group relative',
                  row.isSelected && 'bg-info-backdrop',
                  canSelectRows && 'cursor-pointer hover:bg-contrast',
                )}
                onClick={handleRowClick(row.id)}
                onDoubleClick={handleRowDoubleClick(row.id)}
                onContextMenu={handleRowContextMenu(row.id)}
              >
                {row.cells.map((cell, index) => {
                  if (cell.hidden) {
                    return null
                  }

                  return (
                    <td key={index} className="py-3 px-3">
                      {cell.render}
                    </td>
                  )
                })}
                {row.rowActions ? (
                  <div
                    className={classNames(
                      'absolute right-3 top-1/2 -translate-y-1/2',
                      row.isSelected ? '' : 'invisible group-hover:visible',
                    )}
                  >
                    {row.rowActions}
                  </div>
                ) : null}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default Table
