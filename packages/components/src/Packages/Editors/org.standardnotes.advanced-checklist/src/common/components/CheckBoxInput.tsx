import { ChangeEvent, forwardRef, MouseEvent } from 'react'

type CheckBoxInputProps = {
  checked?: boolean
  disabled?: boolean
  testId?: string
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
  onClick?: (event: MouseEvent<SVGElement>) => void
}

export const CheckBoxInput = forwardRef<HTMLInputElement, CheckBoxInputProps>(
  ({ checked, disabled, testId, onChange, onClick }, ref) => {
    return (
      <label className="checkbox-container">
        <input
          className="checkbox-state"
          type="checkbox"
          checked={checked}
          data-testid={testId}
          disabled={disabled}
          onChange={onChange}
          ref={ref}
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="3 2 22 20"
          className="checkbox-button"
          onClick={onClick}
        >
          <use xlinkHref="#checkbox-square" className="checkbox-square"></use>
          <use xlinkHref="#checkbox-mark" className="checkbox-mark"></use>
          <use xlinkHref="#checkbox-circle" className="checkbox-circle"></use>
        </svg>
      </label>
    )
  },
)
