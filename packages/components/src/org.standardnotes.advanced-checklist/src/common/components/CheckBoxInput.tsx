import React, { ChangeEvent, forwardRef } from 'react'

type CheckBoxInputProps = {
  checked?: boolean
  disabled?: boolean
  testId?: string
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
}

export const CheckBoxInput = forwardRef<HTMLInputElement, CheckBoxInputProps>(
  ({ checked, disabled, testId, onChange }, ref) => {
    function onCheckBoxButtonClick({
      currentTarget,
    }: React.MouseEvent<SVGElement>) {
      !checked
        ? currentTarget.classList.add('explode')
        : currentTarget.classList.remove('explode')
    }

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
          onClick={onCheckBoxButtonClick}
        >
          <use xlinkHref="#checkbox-square" className="checkbox-square"></use>
          <use xlinkHref="#checkbox-mark" className="checkbox-mark"></use>
          <use xlinkHref="#checkbox-circle" className="checkbox-circle"></use>
        </svg>
      </label>
    )
  }
)
