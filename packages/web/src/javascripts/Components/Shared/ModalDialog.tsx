import { useRef, ReactNode } from 'react'
import { AlertDialogContent, AlertDialogOverlay } from '@reach/alert-dialog'

type Props = {
  children: ReactNode
  onDismiss?: () => void
  className?: string
}

const ModalDialog = ({ children, onDismiss, className }: Props) => {
  const ldRef = useRef<HTMLButtonElement>(null)

  return (
    <AlertDialogOverlay leastDestructiveRef={ldRef} onDismiss={onDismiss}>
      <AlertDialogContent
        tabIndex={0}
        className={`flex w-160 flex-col border border-solid border-border bg-default p-0 shadow-main ${className}`}
      >
        {children}
      </AlertDialogContent>
    </AlertDialogOverlay>
  )
}

export default ModalDialog
