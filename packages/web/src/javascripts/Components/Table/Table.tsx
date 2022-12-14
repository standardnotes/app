import { classNames } from '@standardnotes/snjs'
import Icon from '../Icon/Icon'
import { Table } from './CommonTypes'

function Table<Data>({ table }: { table: Table<Data> }) {
  return (
    <div className="block min-h-0 overflow-auto">
      {table.showSelectionActions && (
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-info-0 text-sm font-medium">{table.selectedRows.length} selected</span>
          {table.selectedRows.length > 0 && table.selectionActions}
        </div>
      )}
      <table className="w-full">
        <thead>
          <tr>
            {table.headers.map((header, index) => {
              return (
                <th
                  className={classNames(
                    'px-3 pt-3 pb-2 text-left text-sm font-medium text-passive-0',
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
                  'group relative',
                  row.isSelected && 'bg-info-backdrop',
                  table.canSelectRows && 'cursor-pointer hover:bg-contrast',
                )}
                onClick={table.handleRowClick(row.id)}
                onDoubleClick={table.handleRowDoubleClick(row.id)}
                onContextMenu={table.handleRowContextMenu(row.id)}
              >
                {row.cells.map((cell, index) => {
                  return (
                    <td key={index} className="py-2 px-3">
                      {cell}
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
