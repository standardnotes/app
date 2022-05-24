import { CustomCheckboxContainer, CustomCheckboxInput, CustomCheckboxInputProps } from '@reach/checkbox'
import '@reach/checkbox/styles.css'
import { FunctionComponent, ReactNode, useState } from 'react'

export type SwitchProps = {
  checked?: boolean
  onChange?: (checked: boolean) => void
  className?: string
  children?: ReactNode
  role?: string
  disabled?: boolean
  tabIndex?: number
}

export const Switch: FunctionComponent<SwitchProps> = (props: SwitchProps) => {
  const [checkedState, setChecked] = useState(props.checked || false)
  const checked = props.checked ?? checkedState
  const className = props.className ?? ''

  const isDisabled = !!props.disabled
  const isActive = checked && !isDisabled

  return (
    <label
      className={`sn-component flex justify-between items-center cursor-pointer px-3 ${className} ${
        isDisabled ? 'faded' : ''
      }`}
      {...(props.role ? { role: props.role } : {})}
    >
      {props.children}
      <CustomCheckboxContainer
        checked={checked}
        onChange={(event) => {
          setChecked(event.target.checked)
          props.onChange?.(event.target.checked)
        }}
        className={`sn-switch ${isActive ? 'bg-info' : 'bg-neutral'}`}
        disabled={props.disabled}
      >
        <CustomCheckboxInput
          {...({
            ...props,
            className: undefined,
            children: undefined,
          } as CustomCheckboxInputProps)}
        />
        <span aria-hidden className={`sn-switch-handle ${checked ? 'sn-switch-handle--right' : ''}`} />
      </CustomCheckboxContainer>
    </label>
  )
}
