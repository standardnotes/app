import { useRef, ReactNode } from 'react'
import { AlertDialogContent, AlertDialogOverlay } from '@reach/alert-dialog'
import { classNames } from '@standardnotes/utils'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import MobileModalDialog from './MobileModalDialog'

type Props = {
  children: ReactNode
  open: boolean
  requestClose: () => void
  className?: string
}

const ModalDialog = ({ open, children, requestClose, className }: Props) => {
  const ldRef = useRef<HTMLButtonElement>(null)

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  if (isMobileScreen) {
    return (
      <MobileModalDialog open={open} requestClose={requestClose} className={className}>
        {children}
      </MobileModalDialog>
    )
  }

  if (!open) {
    return null
  }

  return (
    <AlertDialogOverlay className="px-4 md:px-0" leastDestructiveRef={ldRef} onDismiss={requestClose}>
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
