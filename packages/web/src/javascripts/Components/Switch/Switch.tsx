import { Checkbox, VisuallyHidden } from '@ariakit/react'
import { classNames } from '@standardnotes/snjs'

const Switch = ({
  checked,
  onChange,
  className,
  disabled = false,
  tabIndex,
  forceDesktopStyle,
  children,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
  disabled?: boolean
  tabIndex?: number
  forceDesktopStyle?: boolean
  children?: React.ReactNode
}) => {
  const isActive = checked && !disabled

  return (
    <label className={classNames(disabled ? 'opacity-50' : '', className)}>
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
          'relative box-content inline-block flex-shrink-0 cursor-pointer rounded-full border-2 border-solid border-transparent bg-clip-padding transition-colors duration-150 ease-out',
          'ring-2 ring-transparent focus-within:border-default focus-within:shadow-none focus-within:outline-none focus-within:ring-info',
          isActive ? 'bg-info' : 'bg-neutral',
          forceDesktopStyle ? 'h-4.5 w-8' : 'h-7 w-12 md:h-4.5 md:w-8',
        )}
      >
        <div
          className={classNames(
            'absolute top-1/2 block -translate-y-1/2 rounded-full bg-default transition-transform duration-150 ease-out',
            forceDesktopStyle ? 'left-[2px] h-3.5 w-3.5' : 'left-[0.15rem] h-6 w-6 md:left-[2px] md:h-3.5 md:w-3.5',
            checked
              ? forceDesktopStyle
                ? 'translate-x-[calc(2rem-1.125rem)]'
                : 'translate-x-[calc(3.25rem-1.5rem-0.5rem)] md:translate-x-[calc(2rem-1.125rem)]'
              : '',
          )}
        />
      </div>
      {children}
    </label>
  )
}

export default Switch
