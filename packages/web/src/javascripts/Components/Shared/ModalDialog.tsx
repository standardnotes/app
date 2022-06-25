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
        className={`w-160 flex flex-col bg-default border border-solid border-border shadow-main p-0 ${className}`}
      >
        {children}
      </AlertDialogContent>
    </AlertDialogOverlay>
  )
}

export default ModalDialog
