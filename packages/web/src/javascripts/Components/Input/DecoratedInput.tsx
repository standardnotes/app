import { forwardRef, Fragment, Ref } from 'react'
import { DecoratedInputProps } from './DecoratedInputProps'

const getClassNames = (hasLeftDecorations: boolean, hasRightDecorations: boolean, roundedFull?: boolean) => {
  return {
    container: `position-relative flex items-stretch overflow-hidden border border-solid border-passive-3 bg-default text-sm focus-within:ring-2 focus-within:ring-info bg-clip-padding ${
      !hasLeftDecorations && !hasRightDecorations ? 'px-2 py-1.5' : ''
    } ${roundedFull ? 'rounded-full' : 'rounded'}`,
    input: `focus:ring-none w-full border-0 bg-transparent text-text focus:shadow-none focus:outline-none ${
      !hasLeftDecorations && hasRightDecorations ? 'pl-2' : ''
    } ${hasRightDecorations ? 'pr-2' : ''}`,
    disabled: 'bg-passive-5 cursor-not-allowed',
  }
}

/**
 * Input that can be decorated on the left and right side
 */
const DecoratedInput = forwardRef(
  (
    {
      autocomplete = false,
      className,
      disabled = false,
      id,
      left,
      onBlur,
      onChange,
      onFocus,
      onKeyDown,
      onKeyUp,
      placeholder = '',
      right,
      type = 'text',
      title,
      value,
      roundedFull,
    }: DecoratedInputProps,
    ref: Ref<HTMLInputElement>,
  ) => {
    const hasLeftDecorations = Boolean(left?.length)
    const hasRightDecorations = Boolean(right?.length)
    const classNames = getClassNames(hasLeftDecorations, hasRightDecorations, roundedFull)

    return (
      <div className={`${classNames.container} ${disabled ? classNames.disabled : ''} ${className?.container}`}>
        {left && (
          <div className="flex items-center px-2 py-1.5">
            {left.map((leftChild, index) => (
              <Fragment key={index}>{leftChild}</Fragment>
            ))}
          </div>
        )}

        <input
          autoComplete={autocomplete ? 'on' : 'off'}
          className={`${classNames.input} ${disabled ? classNames.disabled : ''} ${className?.input}`}
          data-lpignore={type !== 'password' ? true : false}
          disabled={disabled}
          id={id}
          onBlur={onBlur}
          onChange={(e) => onChange && onChange((e.target as HTMLInputElement).value)}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          placeholder={placeholder}
          ref={ref}
          title={title}
          type={type}
          value={value}
        />

        {right && (
          <div className="flex items-center px-2 py-1.5">
            {right.map((rightChild, index) => (
              <div className={index > 0 ? 'ml-3' : ''} key={index}>
                {rightChild}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  },
)

export default DecoratedInput
