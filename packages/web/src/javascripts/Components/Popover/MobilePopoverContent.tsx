import { useDisableBodyScrollOnMobile } from '@/Hooks/useDisableBodyScrollOnMobile'
import { classNames } from '@standardnotes/snjs'
import { ReactNode } from 'react'
import Portal from '../Portal/Portal'
import MobileModalAction from '../Shared/MobileModalAction'
import { useModalAnimation } from '../Shared/useModalAnimation'

const DisableScroll = () => {
  useDisableBodyScrollOnMobile()

  return null
}

const MobilePopoverContent = ({
  open,
  requestClose,
  children,
  title,
  className,
  id,
}: {
  open: boolean
  requestClose: () => void
  children: ReactNode
  title: string
  id: string
  className?: string
}) => {
  const [isMounted, setPopoverElement] = useModalAnimation(open)

  if (!isMounted) {
    return null
  }

  return (
    <Portal>
      <DisableScroll />
      <div
        ref={setPopoverElement}
        className="fixed top-0 left-0 z-modal flex h-full w-full flex-col bg-default pt-safe-top pb-safe-bottom"
        data-popover={id}
        data-mobile-popover
      >
        <div className="grid w-full grid-cols-[0.35fr_1fr_0.35fr] gap-2 border-b border-border py-1.5 px-2 text-base">
          <div />
          <div className="flex items-center justify-center font-semibold">{title}</div>
          <MobileModalAction type="primary" slot="right" action={requestClose}>
            Done
          </MobileModalAction>
        </div>
        <div className={classNames('h-full overflow-y-auto', className)}>{children}</div>
      </div>
    </Portal>
  )
}

export default MobilePopoverContent
