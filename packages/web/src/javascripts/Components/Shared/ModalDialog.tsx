import { FunctionComponent, useRef } from 'react'
import { AlertDialogContent, AlertDialogOverlay } from '@reach/alert-dialog'

const ModalDialog: FunctionComponent = ({ children }) => {
  const ldRef = useRef<HTMLButtonElement>(null)

  return (
    <AlertDialogOverlay leastDestructiveRef={ldRef}>
      <AlertDialogContent
        tabIndex={0}
        className="w-160 flex flex-col bg-default border border-solid border-border shadow-md p-0"
      >
        {children}
      </AlertDialogContent>
    </AlertDialogOverlay>
  )
}

export default ModalDialog
