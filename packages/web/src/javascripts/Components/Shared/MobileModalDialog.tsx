import { useRef, ReactNode } from 'react'
import { AlertDialogContent, AlertDialogOverlay } from '@reach/alert-dialog'
import { classNames } from '@standardnotes/utils'
import { useDisableBodyScrollOnMobile } from '@/Hooks/useDisableBodyScrollOnMobile'
import { useLifecycleAnimation } from '@/Hooks/useLifecycleAnimation'
import { EnterFromBelowAnimation, ExitToBelowAnimation } from '@/Constants/Animations'

type Props = {
  children: ReactNode
  isOpen: boolean
  close: () => void
  className?: string
}

const MobileModalDialog = ({ isOpen, children, close, className }: Props) => {
  const ldRef = useRef<HTMLButtonElement>(null)

  const [isMounted, setElement] = useLifecycleAnimation({
    open: isOpen,
    enter: EnterFromBelowAnimation,
    exit: ExitToBelowAnimation,
  })

  useDisableBodyScrollOnMobile()

  if (!isMounted) {
    return null
  }

  return (
    <AlertDialogOverlay leastDestructiveRef={ldRef} onDismiss={close}>
      <AlertDialogContent
        tabIndex={0}
        ref={setElement}
        className={classNames('m-0 flex h-full w-full flex-col overflow-hidden p-0', className)}
      >
        {children}
      </AlertDialogContent>
    </AlertDialogOverlay>
  )
}

export default MobileModalDialog
