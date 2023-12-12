import Icon from '@/Components/Icon/Icon'
import { DropdownItem } from './DropdownItem'
import { classNames } from '@standardnotes/snjs'
import { Select, SelectItem, SelectLabel, SelectPopover, SelectStoreProps, useSelectStore } from '@ariakit/react'
import { KeyboardKey } from '@standardnotes/ui-services'

type DropdownProps = {
  label: string
  items: DropdownItem[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  classNameOverride?: {
    wrapper?: string
    button?: string
    popover?: string
  }
  fullWidth?: boolean
  popoverPlacement?: SelectStoreProps['placement']
  showLabel?: boolean
}

const Dropdown = ({
  label,
  value,
  onChange,
  items,
  disabled,
  fullWidth,
  classNameOverride = {},
  popoverPlacement,
  showLabel,
}: DropdownProps) => {
  const select = useSelectStore({
    value,
    setValue: onChange,
    placement: popoverPlacement || 'top',
  })

  const isExpanded = select.useState('open')

  const currentItem = items.find((item) => item.value === value)

  return (
    <div
      className={classNameOverride.wrapper}
      onKeyDown={(event) => {
        if (event.key === KeyboardKey.Escape) {
          event.stopPropagation()
          select.toggle()
        }
      }}
    >
      <SelectLabel className={!showLabel ? 'sr-only' : ''} store={select}>
        {label}
      </SelectLabel>
      <Select
        className={classNames(
          'flex w-full min-w-55 items-center justify-between rounded border border-passive-3 bg-default px-3.5 py-1.5 text-sm text-foreground md:translucent-ui:bg-transparent',
          disabled && 'opacity-50',
          classNameOverride.button,
          !fullWidth && 'md:w-fit',
        )}
        store={select}
        disabled={disabled}
      >
        <div className="flex items-center">
          {currentItem?.icon ? (
            <div className="mr-2 flex">
              <Icon type={currentItem.icon} className={currentItem.iconClassName ?? ''} size="small" />
            </div>
          ) : null}
          <div className="text-base lg:text-sm">{currentItem?.label}</div>
        </div>
        <Icon type="chevron-down" size="normal" className={isExpanded ? 'rotate-180' : ''} />
      </Select>
      <SelectPopover
        store={select}
        className={classNames(
          'z-dropdown-menu max-h-[var(--popover-available-height)] w-[var(--popover-anchor-width)] overflow-y-auto rounded border border-passive-3 bg-default py-1 [backdrop-filter:var(--popover-backdrop-filter)]',
          classNameOverride.popover,
        )}
        portal={false}
      >
        {items.map((item) => (
          <SelectItem
            className="group flex cursor-pointer items-center bg-transparent px-3 py-1.5 text-sm text-text hover:bg-contrast hover:text-foreground [&[data-active-item]]:bg-info [&[data-active-item]]:text-info-contrast"
            key={item.value}
            value={item.value}
            disabled={item.disabled}
          >
            {item.icon ? (
              <div className="mr-3 flex">
                <Icon type={item.icon} className={item.iconClassName ?? ''} size="small" />
              </div>
            ) : null}
            <div className="text-base lg:text-sm">{item.label}</div>
          </SelectItem>
        ))}
      </SelectPopover>
    </div>
  )
}

export default Dropdown
