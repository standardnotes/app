import { CustomCheckboxContainer, CustomCheckboxInput, CustomCheckboxInputProps } from '@reach/checkbox'
import { FunctionComponent, useState } from 'react'
import { SwitchProps } from './SwitchProps'

const Switch: FunctionComponent<SwitchProps> = (props: SwitchProps) => {
  const [checkedState, setChecked] = useState(props.checked || false)
  const checked = props.checked ?? checkedState
  const className = props.className ?? ''

  const isDisabled = !!props.disabled
  const isActive = checked && !isDisabled

  return (
    <label
      className={`sn-component flex justify-between items-center cursor-pointer px-3 ${className} ${
        isDisabled ? 'opacity-50' : ''
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
        className={`w-8 h-4.5 inline-block relative box-content bg-clip-padding cursor-pointer border-2 border-solid border-transparent rounded-full focus-within:shadow-none focus-within:outline-none focus-within:ring-info focus-within:border-default transition-colors duration-150 ease-out ${
          isActive ? 'bg-info' : 'bg-neutral'
        }`}
        disabled={props.disabled}
      >
        <CustomCheckboxInput
          {...({
            ...props,
            className:
              'absolute top-0 left-0 m-0 p-0 w-full h-full opacity-0 z-[1] shadow-none outline-none cursor-pointer',
            children: undefined,
          } as CustomCheckboxInputProps)}
        />
        <span
          aria-hidden
          className={`absolute block bg-default rounded-full w-3.5 h-3.5 left-[2px] top-1/2 -translate-y-1/2 transition-transform duration-150 ease-out ${
            checked ? 'translate-x-[calc(2rem-1.125rem)]' : ''
          }`}
        />
      </CustomCheckboxContainer>
    </label>
  )
}

export default Switch
