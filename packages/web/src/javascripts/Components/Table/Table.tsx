import { classNames } from '@standardnotes/snjs'
import { KeyboardKey } from '@standardnotes/ui-services'
import { useCallback, useState, useRef } from 'react'
import { useApplication } from '../ApplicationProvider'
import Icon from '../Icon/Icon'
import { Table, TableRow } from './CommonTypes'

function TableRow<Data>({
  row,
  index: rowIndex,
  canSelectRows,
  handleRowClick,
  handleRowContextMenu,
  handleActivateRow,
}: {
  row: TableRow<Data>
  index: number
  canSelectRows: Table<Data>['canSelectRows']
  handleRowClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, id: string) => void
  handleRowContextMenu: Table<Data>['handleRowContextMenu']
  handleActivateRow: Table<Data>['handleActivateRow']
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const isHoveredOrFocused = isHovered || isFocused

  const visibleCells = row.cells.filter((cell) => !cell.hidden)

  return (
    <div
      role="row"
      id={row.id}
      aria-rowindex={rowIndex + 2}
      {...(canSelectRows ? { 'aria-selected': row.isSelected } : {})}
      className="group relative contents"
      onMouseEnter={() => {
        setIsHovered(true)
      }}
      onMouseLeave={() => {
        setIsHovered(false)
      }}
      onClick={(event) => handleRowClick(event, row.id)}
      onDoubleClick={() => handleActivateRow(row.id)}
      onContextMenu={handleRowContextMenu(row.id)}
      onFocus={() => {
        setIsFocused(true)
      }}
      onBlur={(event) => {
        if (!event.relatedTarget?.closest(`[id="${row.id}"]`)) {
          setIsFocused(false)
        }
      }}
    >
      {visibleCells.map((cell, index, array) => {
        return (
          <div
            role="gridcell"
            aria-rowindex={rowIndex + 2}
            aria-colindex={cell.colIndex + 1}
            key={index}
            className={classNames(
              'relative flex items-center overflow-hidden border-b border-border px-3 py-4 focus:border-info',
              row.isSelected && 'bg-info-backdrop',
              canSelectRows && 'cursor-pointer',
              canSelectRows && isHoveredOrFocused && 'bg-contrast',
            )}
            tabIndex={-1}
          >
            {cell.render}
            {row.rowActions && index === array.length - 1 && (
              <div
                className={classNames(
                  'absolute right-0 top-0 flex h-full items-center p-2',
                  row.isSelected ? '' : isHoveredOrFocused ? '' : 'invisible',
                  isFocused && 'visible',
                )}
              >
                <div className="z-[1]">{row.rowActions}</div>
                <div
                  className={classNames(
                    'absolute right-0 top-0 z-0 h-full w-full backdrop-blur-[2px]',
                    row.isSelected ? '' : isHoveredOrFocused ? '' : 'invisible',
                  )}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const MinTableRowHeight = 50
const MinRowsToDisplay = 20
const PageSize = Math.ceil(document.documentElement.clientHeight / MinTableRowHeight) || MinRowsToDisplay
const PageScrollThreshold = 200

function Table<Data>({ table }: { table: Table<Data> }) {
  const application = useApplication()

  const [rowsToDisplay, setRowsToDisplay] = useState<number>(PageSize)
  const paginate = useCallback(() => {
    setRowsToDisplay((cellsToDisplay) => cellsToDisplay + PageSize)
  }, [])
  const onScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement, UIEvent>) => {
      const offset = PageScrollThreshold
      const element = event.target as HTMLElement
      if (element.scrollTop + element.offsetHeight >= element.scrollHeight - offset) {
        paginate()
      }
    },
    [paginate],
  )

  const {
    id,
    headers,
    rows,
    colCount,
    rowCount,
    selectRow,
    multiSelectRow,
    rangeSelectUpToRow,
    handleRowContextMenu,
    handleActivateRow,
    selectedRows,
    selectionActions,
    canSelectRows,
    canSelectMultipleRows,
    showSelectionActions,
  } = table

  const focusedRowIndex = useRef<number>(0)
  const focusedCellIndex = useRef<number>(0)

  const onFocus: React.FocusEventHandler = useCallback((event) => {
    const target = event.target as HTMLElement
    const row = target.closest('[role="row"]') as HTMLElement
    const cell = target.closest('[role="gridcell"],[role="columnheader"]') as HTMLElement
    if (row) {
      focusedRowIndex.current = parseInt(row.getAttribute('aria-rowindex') || '0')
    }
    if (cell) {
      focusedCellIndex.current = parseInt(cell.getAttribute('aria-colindex') || '0')
    }
  }, [])

  const onBlur: React.FocusEventHandler = useCallback((event) => {
    const activeElement = document.activeElement as HTMLElement
    if (activeElement.closest('[role="grid"]') !== event.target) {
      focusedRowIndex.current = 0
      focusedCellIndex.current = 0
    }
  }, [])

  const onKeyDown: React.KeyboardEventHandler = useCallback(
    (event) => {
      const gridElement = event.currentTarget
      const allRenderedRows = gridElement.querySelectorAll<HTMLElement>('[role="row"]')
      const currentRow = Array.from(allRenderedRows).find(
        (row) => row.getAttribute('aria-rowindex') === focusedRowIndex.current.toString(),
      )
      const allFocusableCells = Array.from(currentRow ? currentRow.querySelectorAll<HTMLElement>('[tabindex]') : [])
      const allRenderedColumnsLength = headers.length

      const focusCell = (rowIndex: number, colIndex: number) => {
        const row = gridElement.querySelector(`[role="row"][aria-rowindex="${rowIndex}"]`)
        if (!row) {
          return
        }
        const cell = row.querySelector<HTMLElement>(`[aria-colindex="${colIndex}"]`)
        if (cell) {
          cell.focus()
        }
      }

      switch (event.key) {
        case KeyboardKey.Up:
          event.preventDefault()
          if (focusedRowIndex.current > 1) {
            const previousRow = focusedRowIndex.current - 1
            focusCell(previousRow, focusedCellIndex.current)
          }
          break
        case KeyboardKey.Down:
          event.preventDefault()
          if (focusedRowIndex.current <= rowCount) {
            const nextRow = focusedRowIndex.current + 1
            focusCell(nextRow, focusedCellIndex.current)
          }
          break
        case KeyboardKey.Left: {
          event.preventDefault()
          if (!allFocusableCells) {
            return
          }
          const currentCellIndex = allFocusableCells.findIndex(
            (cell) => parseInt(cell.getAttribute('aria-colindex') || '0') === focusedCellIndex.current,
          )
          if (currentCellIndex === 0) {
            return
          }
          const previousCell = allFocusableCells[currentCellIndex - 1]
          if (!previousCell) {
            return
          }
          previousCell.focus()
          break
        }
        case KeyboardKey.Right: {
          event.preventDefault()
          if (!allFocusableCells) {
            return
          }
          const currentCellIndex = allFocusableCells.findIndex(
            (cell) => parseInt(cell.getAttribute('aria-colindex') || '0') === focusedCellIndex.current,
          )
          if (currentCellIndex === allFocusableCells.length - 1) {
            return
          }
          const nextCell = allFocusableCells[currentCellIndex + 1]
          if (!nextCell) {
            return
          }
          nextCell.focus()
          break
        }
        case KeyboardKey.Home:
          event.preventDefault()
          if (event.ctrlKey) {
            focusCell(1, 1)
          } else {
            if (!allFocusableCells) {
              return
            }
            const firstFocusableCell = allFocusableCells[0]
            if (!firstFocusableCell) {
              return
            }
            const firstCellIndex = parseInt(firstFocusableCell.getAttribute('aria-colindex') || '0')
            if (firstCellIndex > 0) {
              focusCell(focusedRowIndex.current, firstCellIndex)
            }
          }
          break
        case KeyboardKey.End: {
          event.preventDefault()
          if (event.ctrlKey) {
            focusCell(allRenderedRows.length, allRenderedColumnsLength || colCount)
            return
          }
          if (!allFocusableCells) {
            return
          }
          const lastFocusableCell = allFocusableCells[allFocusableCells.length - 1]
          if (!lastFocusableCell) {
            return
          }
          const lastCellIndex = parseInt(lastFocusableCell.getAttribute('aria-colindex') || '0')
          if (lastCellIndex > 0) {
            focusCell(focusedRowIndex.current, lastCellIndex)
          }
          break
        }
        case KeyboardKey.PageUp: {
          event.preventDefault()
          const previousRow = focusedRowIndex.current - 5
          if (previousRow > 0) {
            focusCell(previousRow, focusedCellIndex.current)
          } else {
            focusCell(1, focusedCellIndex.current)
          }
          break
        }
        case KeyboardKey.PageDown: {
          event.preventDefault()
          const nextRow = focusedRowIndex.current + 5
          if (nextRow <= allRenderedRows.length) {
            focusCell(nextRow, focusedCellIndex.current)
          } else {
            focusCell(allRenderedRows.length, focusedCellIndex.current)
          }
          break
        }
        case KeyboardKey.Enter: {
          const target = event.target as HTMLElement
          const closestColumnHeader = target.closest<HTMLElement>('[role="columnheader"]')
          if (closestColumnHeader && closestColumnHeader.getAttribute('data-can-sort')) {
            event.preventDefault()
            closestColumnHeader.click()
            return
          }
          const currentRowId = currentRow?.id
          if (currentRowId) {
            event.preventDefault()
            handleActivateRow(currentRowId)
          }
          break
        }
        case KeyboardKey.Space: {
          const target = event.target as HTMLElement
          const currentRowId = currentRow?.id
          if (!currentRowId) {
            return
          }
          if (target.getAttribute('role') !== 'gridcell') {
            return
          }
          event.preventDefault()
          const isCmdOrCtrlPressed = application.keyboardService.isMac ? event.metaKey : event.ctrlKey
          if (isCmdOrCtrlPressed && canSelectMultipleRows) {
            multiSelectRow(currentRowId)
          } else if (event.shiftKey && canSelectMultipleRows) {
            rangeSelectUpToRow(currentRowId)
          } else {
            selectRow(currentRowId)
          }
          break
        }
      }
    },
    [
      application.keyboardService.isMac,
      canSelectMultipleRows,
      colCount,
      handleActivateRow,
      headers.length,
      multiSelectRow,
      rangeSelectUpToRow,
      rowCount,
      selectRow,
    ],
  )

  const handleRowClick = useCallback(
    (event: React.MouseEvent, rowId: string) => {
      if (!canSelectRows) {
        return
      }
      const isCmdOrCtrlPressed = application.keyboardService.isMac ? event.metaKey : event.ctrlKey
      if (isCmdOrCtrlPressed && canSelectMultipleRows) {
        multiSelectRow(rowId)
      } else if (event.shiftKey && canSelectMultipleRows) {
        rangeSelectUpToRow(rowId)
      } else {
        selectRow(rowId)
      }
    },
    [
      application.keyboardService.isMac,
      canSelectMultipleRows,
      canSelectRows,
      multiSelectRow,
      rangeSelectUpToRow,
      selectRow,
    ],
  )

  return (
    <div className="block min-h-0 overflow-auto" onScroll={onScroll}>
      {showSelectionActions && selectedRows.length >= 2 && (
        <div className="sticky top-0 z-[2] flex items-center justify-between border-b border-border bg-default px-3 py-2">
          <span className="text-info-0 text-sm font-medium">{selectedRows.length} selected</span>
          {selectedRows.length > 0 && selectionActions}
        </div>
      )}
      <div
        className="relative grid w-full overflow-x-hidden px-3"
        role="grid"
        aria-colcount={colCount}
        aria-rowcount={rowCount}
        aria-multiselectable={canSelectMultipleRows}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        id={`table-${id}`}
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
                    'border-b border-border px-3 pb-2 pt-3 text-left text-sm font-medium text-passive-0',
                    header.sortBy &&
                      'cursor-pointer hover:bg-info-backdrop hover:underline focus:border-info focus:bg-info-backdrop',
                  )}
                  style={{
                    gridColumn: index + 1,
                  }}
                  onClick={header.onSortChange}
                  key={index.toString()}
                  data-can-sort={header.sortBy ? true : undefined}
                  {...(header.sortBy && { tabIndex: index === 0 ? 0 : -1 })}
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
        <div className="contents whitespace-nowrap">
          {rows.slice(0, rowsToDisplay).map((row, index) => (
            <TableRow
              row={row}
              key={row.id}
              index={index}
              canSelectRows={canSelectRows}
              handleRowClick={handleRowClick}
              handleRowContextMenu={handleRowContextMenu}
              handleActivateRow={handleActivateRow}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Table
