import { FunctionComponent, ReactNode } from 'react'
import { AlertDialogDescription } from '@reach/alert-dialog'

type Props = {
  className?: string
  children?: ReactNode
}

const ModalDialogDescription: FunctionComponent<Props> = ({ children, className = '' }) => (
  <AlertDialogDescription className={`flex-grow overflow-y-auto ${className}`}>{children}</AlertDialogDescription>
)

export default ModalDialogDescription
