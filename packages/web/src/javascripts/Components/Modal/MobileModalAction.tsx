import { classNames } from '@standardnotes/snjs'
import { ComponentPropsWithoutRef, ForwardedRef, forwardRef, ReactNode } from 'react'

type Props = {
  children: ReactNode
  action: () => void
  slot: 'left' | 'right'
  type?: 'primary' | 'secondary' | 'destructive' | 'cancel'
} & Omit<ComponentPropsWithoutRef<'button'>, 'onClick' | 'type'>

const MobileModalAction = forwardRef(
  ({ children, action, type = 'primary', slot, className, ...props }: Props, ref: ForwardedRef<HTMLButtonElement>) => {
    return (
      <button
        ref={ref}
        className={classNames(
          'flex select-none whitespace-nowrap px-1 py-1 font-semibold focus:shadow-none focus:outline-none active:shadow-none active:outline-none active:brightness-50 disabled:text-neutral md:hidden',
          slot === 'left' ? 'justify-start text-left' : 'justify-end text-right',
          type === 'cancel' || type === 'destructive' ? 'text-danger' : 'text-info',
          className,
        )}
        onClick={action}
        {...props}
      >
        {children}
      </button>
    )
  },
)

export default MobileModalAction
