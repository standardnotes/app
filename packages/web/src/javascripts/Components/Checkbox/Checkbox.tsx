import { classNames } from '@standardnotes/snjs'
import { ChangeEventHandler, FunctionComponent } from 'react'

type CheckboxProps = {
  name: string
  checked: boolean
  onChange: ChangeEventHandler<HTMLInputElement>
  disabled?: boolean
  label: string
}

const Checkbox: FunctionComponent<CheckboxProps> = ({ name, checked, onChange, disabled, label }) => {
  return (
    <label
      htmlFor={name}
      className={classNames(
        'fit-content mb-2 flex items-center text-sm',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
      )}
    >
      <input
        className={classNames('mr-2', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}
        type="checkbox"
        name={name}
        id={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      {label}
    </label>
  )
}

export default Checkbox
