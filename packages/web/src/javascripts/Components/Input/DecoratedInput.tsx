import { classNames } from '@standardnotes/utils'
import { forwardRef, Fragment, KeyboardEventHandler, Ref, useCallback } from 'react'
import { DecoratedInputProps } from './DecoratedInputProps'

const getClassNames = (hasLeftDecorations: boolean, hasRightDecorations: boolean, roundedFull?: boolean) => {
  return {
    container: `position-relative flex items-stretch overflow-hidden border border-border translucent-ui:border-[--popover-border-color] bg-default translucent-ui:bg-transparent text-sm focus-within:ring-2 focus-within:ring-info bg-clip-padding ${
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
      spellcheck = true,
      className,
      disabled = false,
      id,
      left,
      onBlur,
      onChange,
      onFocus,
      onKeyDown,
      onKeyUp,
      onEnter,
      placeholder = '',
      right,
      type = 'text',
      title,
      value,
      defaultValue,
      roundedFull,
      autofocus = false,
    }: DecoratedInputProps,
    ref: Ref<HTMLInputElement>,
  ) => {
    const hasLeftDecorations = Boolean(left?.length)
    const hasRightDecorations = Boolean(right?.length)
    const computedClassNames = getClassNames(hasLeftDecorations, hasRightDecorations, roundedFull)

    const handleKeyUp: KeyboardEventHandler = useCallback(
      (e) => {
        if (e.key === 'Enter') {
          onEnter?.()
        }
        onKeyUp?.(e)
      },
      [onKeyUp, onEnter],
    )

    return (
      <div
        className={classNames(
          computedClassNames.container,
          disabled ? computedClassNames.disabled : '',
          className?.container,
        )}
      >
        {left && (
          <div className={classNames('flex items-center px-2 py-1.5', className?.left)}>
            {left.map((leftChild, index) => (
              <Fragment key={index}>{leftChild}</Fragment>
            ))}
          </div>
        )}

        <input
          autoComplete={autocomplete ? 'on' : 'off'}
          autoFocus={autofocus}
          className={`${computedClassNames.input} ${disabled ? computedClassNames.disabled : ''} ${className?.input}`}
          data-lpignore={type !== 'password' ? true : false}
          disabled={disabled}
          id={id}
          onBlur={onBlur}
          onChange={(e) => onChange && onChange((e.target as HTMLInputElement).value)}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          onKeyUp={handleKeyUp}
          placeholder={placeholder}
          ref={ref}
          title={title}
          type={type}
          value={value}
          defaultValue={defaultValue}
          spellCheck={spellcheck}
        />

        {right && (
          <div className={classNames('flex items-center px-2 py-1.5', className?.right)}>
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
