import { Checkbox, VisuallyHidden } from '@ariakit/react'
import { classNames } from '@standardnotes/snjs'

const Switch = ({
  checked,
  onChange,
  className,
  disabled = false,
  tabIndex,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
  disabled?: boolean
  tabIndex?: number
}) => {
  const isActive = checked && !disabled

  return (
    <label
      className={classNames(
        'relative box-content inline-block h-8 w-13 flex-shrink-0 cursor-pointer rounded-full border-2 border-solid border-transparent bg-clip-padding transition-colors duration-150 ease-out md:h-4.5 md:w-8',
        'ring-2 ring-transparent focus-within:border-default focus-within:shadow-none focus-within:outline-none focus-within:ring-info',
        disabled ? 'opacity-50' : '',
        isActive ? 'bg-info' : 'bg-neutral',
        className,
      )}
    >
      <VisuallyHidden>
        <Checkbox
          checked={checked}
          onChange={(event) => {
            onChange(event.target.checked)
          }}
          tabIndex={tabIndex}
        />
      </VisuallyHidden>
      <div
        className={classNames(
          'absolute left-[0.275rem] top-1/2 block h-6 w-6 -translate-y-1/2 rounded-full bg-default transition-transform duration-150 ease-out md:left-[2px] md:h-3.5 md:w-3.5',
          checked ? 'translate-x-[calc(3.25rem-1.5rem-0.5rem)] md:translate-x-[calc(2rem-1.125rem)]' : '',
        )}
      />
    </label>
  )
}

export default Switch
