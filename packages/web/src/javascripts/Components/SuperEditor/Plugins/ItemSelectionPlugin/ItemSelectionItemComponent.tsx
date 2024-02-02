import LinkedItemMeta from '@/Components/LinkedItems/LinkedItemMeta'
import { LinkedItemSearchResultsAddTagOption } from '@/Components/LinkedItems/LinkedItemSearchResultsAddTagOption'
import { PopoverItemClassNames } from '../ClassNames'
import { ItemOption } from './ItemOption'
import { classNames } from '@standardnotes/snjs'

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
      className={classNames(
        'gap-4',
        PopoverItemClassNames,
        isSelected && 'bg-info-backdrop',
        option.item && 'px-3 py-2',
      )}
      ref={option.setRefElement}
      role="option"
      aria-selected={isSelected}
      id={'typeahead-item-' + index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      {option.item && <LinkedItemMeta item={option.item} searchQuery={searchQuery} />}
      {!option.item && (
        <LinkedItemSearchResultsAddTagOption
          searchQuery={searchQuery}
          onClickCallback={onClick}
          isFocused={isSelected}
        />
      )}
    </li>
  )
}
