import { classNames } from '@standardnotes/snjs'
import { TableRowProps } from './Table'

export type TableRowModifier<Data> = (data: Data, existingProps: TableRowProps) => TableRowProps

export function rowStyleModifier<Data>(className: string): TableRowModifier<Data> {
  return (_data, existingProps) => ({
    className: existingProps.className ? classNames(existingProps.className, className) : className,
  })
}

export function clickableRowModifier<Data>(onClick: (data: Data) => void): TableRowModifier<Data> {
  const className = 'cursor-pointer hover:bg-info-backdrop'
  return (data: Data, existingProps: TableRowProps) => ({
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
