import Icon from '@/Components/Icon/Icon'
import { PopoverItemClassNames } from '../ClassNames'
import { BlockPickerOption } from './BlockPickerOption'
import { classNames } from '@standardnotes/snjs'

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
      className={classNames(
        'gap-3 border-b-[0.5px] border-border px-3 py-2',
        isSelected && 'bg-info-backdrop',
        PopoverItemClassNames,
      )}
      ref={option.setRefElement}
      role="option"
      aria-selected={isSelected}
      id={'typeahead-item-' + index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      <Icon type={option.iconName} className="h-5 w-5 flex-shrink-0" />
      <div className="text-editor">{option.title}</div>
    </li>
  )
}
