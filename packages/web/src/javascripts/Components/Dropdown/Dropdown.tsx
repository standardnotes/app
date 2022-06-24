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
    <div className="flex items-center">
      {icon ? (
        <div className="flex mr-2">
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
          className="rounded px-3.5 py-1.5 w-fit bg-default text-sm text-text border-solid border-border border-1 min-w-55"
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
                  className="flex items-center border-0 cursor-pointer hover:bg-contrast hover:text-foreground text-text bg-transparent px-3 py-1.5 text-left w-full focus:bg-info-backdrop focus:shadow-none text-sm"
                  value={item.value}
                  label={item.label}
                  disabled={item.disabled}
                >
                  {item.icon ? (
                    <div className="flex mr-3">
                      <Icon type={item.icon} className={item.iconClassName ?? ''} size="small" />
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
