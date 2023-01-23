import { useDisableBodyScrollOnMobile } from '@/Hooks/useDisableBodyScrollOnMobile'
import { classNames } from '@standardnotes/snjs'
import { ReactNode } from 'react'
import Portal from '../Portal/Portal'
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
}: {
  open: boolean
  requestClose: () => void
  children: ReactNode
  title: string
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
      >
        <div className="flex items-center justify-between border-b border-border py-2.5 px-3 text-base">
          <div />
          <div className="font-semibold">{title}</div>
          <button className="font-semibold text-info active:shadow-none active:outline-none" onClick={requestClose}>
            Done
          </button>
        </div>
        <div className={classNames('h-full overflow-y-auto', className)}>{children}</div>
      </div>
    </Portal>
  )
}

export default MobilePopoverContent
