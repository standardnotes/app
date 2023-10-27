import { classNames } from '@standardnotes/snjs'
import { ReactNode } from 'react'

const MenuSection = ({
  title,
  className,
  children,
}: {
  title?: ReactNode
  className?: string
  children: ReactNode
}) => {
  return (
    <div
      className={classNames(
        'my-4 md:my-2 md:border-b md:border-border md:pb-2 md:last:mb-0 md:last:border-b-0 md:last:pb-0 md:first:last:mt-0 md:translucent-ui:border-[--popover-border-color]',
        className,
      )}
    >
      {title && <div className="px-3 py-1 text-sm font-semibold uppercase text-text lg:text-xs">{title}</div>}
      <div className="divide-y divide-passive-3 overflow-hidden rounded-md bg-default md:divide-none md:rounded-none md:bg-transparent">
        {children}
      </div>
    </div>
  )
}

export default MenuSection
