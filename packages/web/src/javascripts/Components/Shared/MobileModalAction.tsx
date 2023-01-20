import { classNames } from '@standardnotes/snjs'
import { ComponentPropsWithoutRef, ReactNode } from 'react'

type Props = {
  children: ReactNode
  action: () => void
  type?: 'submit' | 'cancel'
} & Omit<ComponentPropsWithoutRef<'button'>, 'onClick' | 'type'>

const MobileModalAction = ({ children, action, type = 'submit', className, ...props }: Props) => {
  return (
    <button
      className={classNames(
        'py-1 text-base font-medium active:shadow-none active:outline-none disabled:text-neutral md:hidden',
        type === 'submit' ? 'text-info' : 'text-danger',
        className,
      )}
      onClick={action}
      {...props}
    >
      {children}
    </button>
  )
}

export default MobileModalAction
