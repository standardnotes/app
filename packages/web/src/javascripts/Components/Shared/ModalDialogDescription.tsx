import { FunctionComponent, ReactNode } from 'react'
import { AlertDialogDescription } from '@reach/alert-dialog'

type Props = {
  className?: string
  children?: ReactNode
}

const ModalDialogDescription: FunctionComponent<Props> = ({ children, className = '' }) => (
  <AlertDialogDescription className={`overflow-y-scroll px-4 py-4 ${className}`}>{children}</AlertDialogDescription>
)

export default ModalDialogDescription
