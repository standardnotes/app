import LinkedItemMeta from '@/Components/LinkedItems/LinkedItemMeta'
import { PopoverItemClassNames, PopoverItemSelectedClassNames } from '../ClassNames'
import { ItemOption } from './ItemOption'

type Props = {
  index: number
  isSelected: boolean
  onClick: () => void
  onMouseEnter: () => void
  option: ItemOption
  searchQuery: string
}

export function ItemSelectionItemComponent({ index, isSelected, onClick, onMouseEnter, option, searchQuery }: Props) {
  return (
    <li
      key={option.key}
      tabIndex={-1}
      className={`gap-4 ${PopoverItemClassNames} ${isSelected ? PopoverItemSelectedClassNames : ''}`}
      ref={option.setRefElement}
      role="option"
      aria-selected={isSelected}
      id={'typeahead-item-' + index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      <LinkedItemMeta item={option.item} searchQuery={searchQuery} />
    </li>
  )
}
