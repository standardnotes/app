import { ListboxArrow, ListboxButton, ListboxInput, ListboxList, ListboxOption, ListboxPopover } from '@reach/listbox'
import '@reach/listbox/styles.css'
import VisuallyHidden from '@reach/visually-hidden'
import { FunctionComponent } from 'react'
import Icon from '@/Components/Icon/Icon'
import { DropdownItem } from './DropdownItem'

type DropdownProps = {
  id: string
  label: string
  items: DropdownItem[]
  value: string
  onChange: (value: string, item: DropdownItem) => void
  disabled?: boolean
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
    <div className="sn-dropdown-button-label">
      {icon ? (
        <div className="flex mr-2">
          <Icon type={icon} className={`sn-icon--small ${iconClassName}`} />
        </div>
      ) : null}
      <div className="dropdown-selected-label">{label}</div>
    </div>
    <ListboxArrow className={`sn-dropdown-arrow ${isExpanded ? 'sn-dropdown-arrow-flipped' : ''}`}>
      <Icon type="menu-arrow-down" className="sn-icon--small color-passive-1" />
    </ListboxArrow>
  </>
)

const Dropdown: FunctionComponent<DropdownProps> = ({ id, label, items, value, onChange, disabled }) => {
  const labelId = `${id}-label`

  const handleChange = (value: string) => {
    const selectedItem = items.find((item) => item.value === value) as DropdownItem

    onChange(value, selectedItem)
  }

  return (
    <>
      <VisuallyHidden id={labelId}>{label}</VisuallyHidden>
      <ListboxInput value={value} onChange={handleChange} aria-labelledby={labelId} disabled={disabled}>
        <ListboxButton
          className="sn-dropdown-button"
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
                <ListboxOption
                  key={item.value}
                  className="sn-dropdown-item"
                  value={item.value}
                  label={item.label}
                  disabled={item.disabled}
                >
                  {item.icon ? (
                    <div className="flex mr-3">
                      <Icon type={item.icon} className={`sn-icon--small ${item.iconClassName ?? ''}`} />
                    </div>
                  ) : null}
                  <div className="text-input">{item.label}</div>
                </ListboxOption>
              ))}
            </ListboxList>
          </div>
        </ListboxPopover>
      </ListboxInput>
    </>
  )
}

export default Dropdown
