import { useRef, ReactNode } from 'react'
import { AlertDialogContent, AlertDialogOverlay } from '@reach/alert-dialog'
import { classNames } from '@standardnotes/utils'
import { useLifecycleAnimation } from '@/Hooks/useLifecycleAnimation'

type Props = {
  children: ReactNode
  isOpen?: boolean
  onDismiss?: () => void
  className?: string
}

const MobileModalDialog = ({ children, isOpen, onDismiss, className }: Props) => {
  const ldRef = useRef<HTMLButtonElement>(null)

  const [isMounted, setModalElement] = useLifecycleAnimation({
    open: typeof isOpen === 'boolean' ? isOpen : true,
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
    <AlertDialogOverlay className="p-0 md:px-0" leastDestructiveRef={ldRef} onDismiss={onDismiss}>
      <AlertDialogContent
        tabIndex={0}
        className={classNames(
          'm-0 flex h-full w-full flex-col border-solid border-border bg-default p-0 shadow-main md:max-h-[85vh] md:w-160 md:rounded md:border',
          className,
        )}
        ref={setModalElement}
      >
        {children}
      </AlertDialogContent>
    </AlertDialogOverlay>
  )
}

export default MobileModalDialog
