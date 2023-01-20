import { useRef, ReactNode } from 'react'
import { AlertDialogContent, AlertDialogOverlay } from '@reach/alert-dialog'
import { classNames } from '@standardnotes/utils'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import MobileModalDialog from './MobileModalDialog'

type Props = {
  children: ReactNode
  isOpen?: boolean
  onDismiss?: () => void
  className?: string
}

const ModalDialog = ({ children, isOpen, onDismiss, className }: Props) => {
  const ldRef = useRef<HTMLButtonElement>(null)

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  if (isMobileScreen) {
    return (
      <MobileModalDialog isOpen={isOpen} onDismiss={onDismiss} className={className}>
        {children}
      </MobileModalDialog>
    )
  }

  if (typeof isOpen === 'boolean' && !isOpen) {
    return null
  }

  return (
    <AlertDialogOverlay className="p-0 md:px-0" leastDestructiveRef={ldRef} onDismiss={onDismiss}>
      <AlertDialogContent
        tabIndex={0}
        className={classNames(
          'm-0 flex w-full flex-col border-solid border-border bg-default p-0 shadow-main md:max-h-[85vh] md:w-160 md:rounded md:border',
          className,
        )}
      >
        {children}
      </AlertDialogContent>
    </AlertDialogOverlay>
  )
}

export default ModalDialog
