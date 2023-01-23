import { useLifecycleAnimation } from '@/Hooks/useLifecycleAnimation'
import { useMediaQuery, MutuallyExclusiveMediaQueryBreakpoints } from '@/Hooks/useMediaQuery'
import { AlertDialogOverlay } from '@reach/alert-dialog'
import { classNames } from '@standardnotes/snjs'
import { ReactNode, useRef } from 'react'

type Props = {
  isOpen: boolean
  onDismiss?: () => void
  children: ReactNode
  className?: string
}

const ModalOverlay = ({ isOpen, onDismiss, children, className }: Props) => {
  const ldRef = useRef<HTMLButtonElement>(null)

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  const [isMounted, setElement] = useLifecycleAnimation(
    {
      open: isOpen,
      enter: {
        keyframes: [
          {
            transform: 'translateY(100%)',
          },
          {
            transform: 'translateY(0)',
          },
        ],
        options: {
          easing: 'cubic-bezier(.36,.66,.04,1)',
          duration: 250,
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
            transform: 'translateY(0)',
          },
          {
            transform: 'translateY(100%)',
          },
        ],
        options: {
          easing: 'cubic-bezier(.36,.66,.04,1)',
          duration: 250,
          fill: 'forwards',
        },
        initialStyle: {
          transformOrigin: 'bottom',
        },
      },
    },
    !isMobileScreen,
  )

  if (!isMounted) {
    return null
  }

  return (
    <AlertDialogOverlay
      className={classNames('p-0 md:px-0 md:opacity-100', className)}
      leastDestructiveRef={ldRef}
      onDismiss={onDismiss}
      ref={setElement}
    >
      {children}
    </AlertDialogOverlay>
  )
}

export default ModalOverlay
