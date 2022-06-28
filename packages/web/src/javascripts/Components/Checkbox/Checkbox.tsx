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
    <label htmlFor={name} className="fit-content mb-2 flex items-center text-sm">
      <input
        className="mr-2"
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
