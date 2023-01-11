import { useRef, ReactNode } from 'react'
import { AlertDialogContent, AlertDialogOverlay } from '@reach/alert-dialog'
import { classNames } from '@standardnotes/utils'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import MobileModalDialog from './MobileModalDialog'

type Props = {
  children: ReactNode
  isOpen: boolean
  close: () => void
  className?: string
}

const ModalDialog = ({ isOpen, children, close, className }: Props) => {
  const ldRef = useRef<HTMLButtonElement>(null)

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  if (isMobileScreen) {
    return (
      <MobileModalDialog isOpen={isOpen} close={close} className={className}>
        {children}
      </MobileModalDialog>
    )
  }

  if (!isOpen) {
    return null
  }

  return (
    <AlertDialogOverlay className="px-4 md:px-0" leastDestructiveRef={ldRef} onDismiss={close}>
      <AlertDialogContent
        tabIndex={0}
        className={classNames(
          'flex max-h-[85vh] w-full flex-col rounded border border-solid border-border bg-default p-0 shadow-main md:w-160',
          className,
        )}
      >
        {children}
      </AlertDialogContent>
    </AlertDialogOverlay>
  )
}

export default ModalDialog
