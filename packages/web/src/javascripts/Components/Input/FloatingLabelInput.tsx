import { ChangeEventHandler, Ref, forwardRef, useState } from 'react'

type Props = {
  id: string
  type: 'text' | 'email' | 'password'
  label: string
  value: string
  onChange: ChangeEventHandler<HTMLInputElement>
  disabled?: boolean
  className?: string
  labelClassName?: string
  inputClassName?: string
  isInvalid?: boolean
}

const FloatingLabelInput = forwardRef(
  (
    {
      id,
      type,
      label,
      disabled,
      value,
      isInvalid,
      onChange,
      className = '',
      labelClassName = '',
      inputClassName = '',
    }: Props,
    ref: Ref<HTMLInputElement>,
  ) => {
    const [focused, setFocused] = useState(false)

    const BASE_CLASSNAME = 'relative bg-default'

    const LABEL_CLASSNAME = `absolute ${!focused ? 'text-neutral' : 'text-info'} ${
      focused || value ? 'flex top-0 left-2 pt-1.5 px-1' : 'hidden'
    } ${isInvalid ? 'text-danger' : ''} ${labelClassName}`

    const INPUT_CLASSNAME = `w-full h-full ${
      focused || value ? 'pt-6 pb-2' : 'py-2.5'
    } px-3 text-sm border border-solid border-border rounded placeholder:font-medium focus:ring-info ${
      isInvalid ? 'border-danger placeholder:text-danger' : ''
    } ${inputClassName}`

    const handleFocus = () => setFocused(true)

    const handleBlur = () => setFocused(false)

    return (
      <div className={`${BASE_CLASSNAME} ${className}`}>
        <label htmlFor={id} className={LABEL_CLASSNAME}>
          {label}
        </label>
        <input
          id={id}
          className={INPUT_CLASSNAME}
          placeholder={!focused ? label : ''}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          ref={ref}
          disabled={disabled}
        />
      </div>
    )
  },
)

export default FloatingLabelInput
