import { ListboxArrow, ListboxInput, ListboxList, ListboxPopover } from '@reach/listbox'
import '@reach/listbox/styles.css'
import VisuallyHidden from '@reach/visually-hidden'
import { FunctionComponent } from 'react'
import Icon from '@/Components/Icon/Icon'
import { DropdownItem } from './DropdownItem'
import StyledListboxButton from './StyledListboxButton'
import StyledListboxOption from './StyledListboxOption'

type DropdownProps = {
  id: string
  label: string
  items: DropdownItem[]
  value: string
  onChange: (value: string, item: DropdownItem) => void
  disabled?: boolean
  className?: string
}

type ListboxButtonProps = DropdownItem & {
  isExpanded: boolean
}

const CustomDropdownButton: FunctionComponent<ListboxButtonProps> = ({
  label,
  isExpanded,
  icon,
  iconClassName = '',
}) => (
  <>
    <div className="flex items-center">
      {icon ? (
        <div className="mr-2 flex">
          <Icon type={icon} className={iconClassName} size="small" />
        </div>
      ) : null}
      <div className="dropdown-selected-label">{label}</div>
    </div>
    <ListboxArrow className={`flex ${isExpanded ? 'rotate-180' : ''}`}>
      <Icon type="menu-arrow-down" className="text-passive-1" size="small" />
    </ListboxArrow>
  </>
)

const Dropdown: FunctionComponent<DropdownProps> = ({ id, label, items, value, onChange, disabled, className }) => {
  const labelId = `${id}-label`

  const handleChange = (value: string) => {
    const selectedItem = items.find((item) => item.value === value) as DropdownItem

    onChange(value, selectedItem)
  }

  return (
    <div className={className}>
      <VisuallyHidden id={labelId}>{label}</VisuallyHidden>
      <ListboxInput value={value} onChange={handleChange} aria-labelledby={labelId} disabled={disabled}>
        <StyledListboxButton
          children={({ value, label, isExpanded }) => {
            const current = items.find((item) => item.value === value)
            const icon = current ? current?.icon : null
            const iconClassName = current ? current?.iconClassName : null
            return CustomDropdownButton({
              value: value ? value : label.toLowerCase(),
              label,
              isExpanded,
              ...(icon ? { icon } : null),
              ...(iconClassName ? { iconClassName } : null),
            })
          }}
        />
        <ListboxPopover className="sn-dropdown sn-dropdown-popover">
          <div className="sn-component">
            <ListboxList>
              {items.map((item) => (
                <StyledListboxOption key={item.value} value={item.value} label={item.label} disabled={item.disabled}>
                  {item.icon ? (
                    <div className="mr-3 flex">
                      <Icon type={item.icon} className={item.iconClassName ?? ''} size="small" />
                    </div>
                  ) : null}
                  <div className="text-input">{item.label}</div>
                </StyledListboxOption>
              ))}
            </ListboxList>
          </div>
        </ListboxPopover>
      </ListboxInput>
    </div>
  )
}

export default Dropdown
