import { useDisableBodyScrollOnMobile } from '@/Hooks/useDisableBodyScrollOnMobile'
import { classNames } from '@standardnotes/snjs'
import { ReactNode, useCallback } from 'react'
import Portal from '../Portal/Portal'
import MobileModalAction from '../Modal/MobileModalAction'
import { useModalAnimation } from '../Modal/useModalAnimation'
import MobileModalHeader from '../Modal/MobileModalHeader'
import { mergeRefs } from '@/Hooks/mergeRefs'

const DisableScroll = () => {
  useDisableBodyScrollOnMobile()

  return null
}

type PopoverWithClose = HTMLDivElement & { close: () => void }

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

  const addCloseMethod = useCallback(
    (element: HTMLDivElement | null) => {
      if (element) {
        ;(element as PopoverWithClose).close = requestClose
      }
    },
    [requestClose],
  )

  if (!isMounted) {
    return null
  }

  return (
    <Portal>
      <DisableScroll />
      <div
        ref={mergeRefs([setPopoverElement, addCloseMethod])}
        className="fixed left-0 top-0 z-modal flex h-full w-full flex-col bg-default pb-safe-bottom pt-safe-top"
        data-popover={id}
        data-mobile-popover
      >
        <MobileModalHeader className="border-b border-border px-2 py-1.5 text-base">
          <div />
          <div className="flex items-center justify-center font-semibold">{title}</div>
          <MobileModalAction type="primary" slot="right" action={requestClose}>
            Done
          </MobileModalAction>
        </MobileModalHeader>
        <div className={classNames('h-full overflow-y-auto', className)}>{children}</div>
      </div>
    </Portal>
  )
}

export default MobilePopoverContent
