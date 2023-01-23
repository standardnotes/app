import { useDisableBodyScrollOnMobile } from '@/Hooks/useDisableBodyScrollOnMobile'
import { useLifecycleAnimation } from '@/Hooks/useLifecycleAnimation'
import { classNames } from '@standardnotes/snjs'
import { ReactNode } from 'react'
import Portal from '../Portal/Portal'

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
  const [isMounted, setPopoverElement] = useLifecycleAnimation({
    open,
    enter: {
      keyframes: [
        {
          opacity: 0.25,
          transform: 'translateY(1rem)',
        },
        {
          opacity: 1,
          transform: 'translateY(0)',
        },
      ],
      options: {
        easing: 'cubic-bezier(.36,.66,.04,1)',
        duration: 150,
        fill: 'forwards',
      },
      initialStyle: {
        transformOrigin: 'bottom',
      },
    },
    enterCallback: (element) => {
      element.scrollTop = 0
    },
    exit: {
      keyframes: [
        {
          opacity: 1,
          transform: 'translateY(0)',
        },
        {
          opacity: 0,
          transform: 'translateY(1rem)',
        },
      ],
      options: {
        easing: 'cubic-bezier(.36,.66,.04,1)',
        duration: 150,
        fill: 'forwards',
      },
      initialStyle: {
        transformOrigin: 'bottom',
      },
    },
  })

  if (!isMounted) {
    return null
  }

  return (
    <Portal>
      <DisableScroll />
      <div
        ref={setPopoverElement}
        className="absolute top-0 left-0 z-modal flex h-full w-full origin-bottom flex-col bg-default pt-safe-top pb-safe-bottom opacity-0"
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
