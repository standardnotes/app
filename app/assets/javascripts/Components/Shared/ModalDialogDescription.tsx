import { FunctionComponent } from 'react'
import { AlertDialogDescription } from '@reach/alert-dialog'

type Props = {
  className?: string
}

const ModalDialogDescription: FunctionComponent<Props> = ({ children, className = '' }) => (
  <AlertDialogDescription className={`px-4 py-4 flex flex-row items-center ${className}`}>
    {children}
  </AlertDialogDescription>
)

export default ModalDialogDescription
