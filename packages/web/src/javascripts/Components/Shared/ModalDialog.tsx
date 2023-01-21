import { useRef, ReactNode } from 'react'
import { AlertDialogContent, AlertDialogOverlay } from '@reach/alert-dialog'
import { classNames } from '@standardnotes/utils'

type Props = {
  children: ReactNode
  onDismiss?: () => void
  className?: string
}

const ModalDialog = ({ children, onDismiss, className }: Props) => {
  const ldRef = useRef<HTMLButtonElement>(null)

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
