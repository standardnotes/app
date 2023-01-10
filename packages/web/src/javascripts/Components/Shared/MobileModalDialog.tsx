import { useRef, ReactNode } from 'react'
import { AlertDialogContent, AlertDialogOverlay } from '@reach/alert-dialog'
import { classNames } from '@standardnotes/utils'
import { useDisableBodyScrollOnMobile } from '@/Hooks/useDisableBodyScrollOnMobile'
import { useLifecycleAnimation } from '@/Hooks/useLifecycleAnimation'
import { EnterFromBelowAnimation, ExitToBelowAnimation } from '@/Constants/Animations'

type Props = {
  children: ReactNode
  open: boolean
  requestClose: () => void
  className?: string
}

const MobileModalDialog = ({ open, children, requestClose, className }: Props) => {
  const ldRef = useRef<HTMLButtonElement>(null)

  const [isMounted, setElement] = useLifecycleAnimation({
    open,
    enter: EnterFromBelowAnimation,
    exit: ExitToBelowAnimation,
  })

  useDisableBodyScrollOnMobile()

  if (!isMounted) {
    return null
  }

  return (
    <AlertDialogOverlay leastDestructiveRef={ldRef} onDismiss={requestClose}>
      <AlertDialogContent tabIndex={0} ref={setElement} className={classNames('m-0 h-full w-full p-0', className)}>
        {children}
      </AlertDialogContent>
    </AlertDialogOverlay>
  )
}

export default MobileModalDialog
