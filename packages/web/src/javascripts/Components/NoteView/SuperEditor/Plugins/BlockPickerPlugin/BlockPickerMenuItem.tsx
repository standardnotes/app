import Icon from '@/Components/Icon/Icon'
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
      className={`border-bottom gap-3 border-[0.5px] border-border ${PopoverItemClassNames} ${
        isSelected ? PopoverItemSelectedClassNames : ''
      }`}
      ref={option.setRefElement}
      role="option"
      aria-selected={isSelected}
      id={'typeahead-item-' + index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      <Icon type={option.iconName} className="mt-1.5 h-5 w-5" />
      <div className="text-editor">{option.title}</div>
    </li>
  )
}
