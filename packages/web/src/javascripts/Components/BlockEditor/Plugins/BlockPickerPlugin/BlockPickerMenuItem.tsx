import { PopoverItemClassNames, PopoverItemSelectedClassNames } from '../ClassNames'
import { BlockPickerOption } from './BlockPickerOption'

export function BlockPickerMenuItem({
  index,
  isSelected,
  onClick,
  onMouseEnter,
  option,
}: {
  index: number
  isSelected: boolean
  onClick: () => void
  onMouseEnter: () => void
  option: BlockPickerOption
}) {
  return (
    <li
      key={option.key}
      tabIndex={-1}
      className={`${PopoverItemClassNames} ${isSelected ? PopoverItemSelectedClassNames : ''}`}
      ref={option.setRefElement}
      role="option"
      aria-selected={isSelected}
      id={'typeahead-item-' + index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      <i className={`icon ${option.iconName} mr-[8px] flex h-5 w-5 bg-contain fill-current text-center`} />
      <div className="">{option.title}</div>
    </li>
  )
}
