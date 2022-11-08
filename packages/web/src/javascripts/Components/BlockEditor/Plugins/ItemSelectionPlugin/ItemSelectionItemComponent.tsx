import { ItemOption } from './ItemOption'

type Props = {
  index: number
  isSelected: boolean
  onClick: () => void
  onMouseEnter: () => void
  option: ItemOption
}

export function ItemSelectionItemComponent({ index, isSelected, onClick, onMouseEnter, option }: Props) {
  let className = 'item'
  if (isSelected) {
    className += ' selected'
  }
  return (
    <li
      key={option.key}
      tabIndex={-1}
      className={className}
      ref={option.setRefElement}
      role="option"
      aria-selected={isSelected}
      id={'typeahead-item-' + index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      {option.icon}
      <span className="text">{option.item.title}</span>
    </li>
  )
}
