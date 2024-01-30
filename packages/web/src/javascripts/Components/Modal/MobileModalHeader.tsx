import { classNames } from '@standardnotes/utils'
import { ReactNode } from 'react'

type Props = {
  className?: string
  children: ReactNode
}

const MobileModalHeader = ({ className, children }: Props) => {
  return (
    <div
      className={classNames(
        'grid w-full select-none grid-cols-[0.35fr_1fr_0.35fr] gap-2 text-[1.05rem] leading-6',
        className,
      )}
      data-mobile-modal-header
    >
      {children}
    </div>
  )
}

export default MobileModalHeader
