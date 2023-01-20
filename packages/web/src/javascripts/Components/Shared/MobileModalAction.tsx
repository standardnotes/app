import { classNames } from '@standardnotes/snjs'
import { ComponentPropsWithoutRef, ReactNode } from 'react'

type Props = {
  children: ReactNode
  action: () => void
  type?: 'primary' | 'secondary' | 'destructive' | 'cancel'
} & Omit<ComponentPropsWithoutRef<'button'>, 'onClick' | 'type'>

const MobileModalAction = ({ children, action, type = 'primary', className, ...props }: Props) => {
  return (
    <button
      className={classNames(
        'py-1 px-1 text-base font-medium active:shadow-none active:outline-none disabled:text-neutral md:hidden',
        type === 'cancel' || type === 'destructive' ? 'text-danger' : 'text-info',
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
