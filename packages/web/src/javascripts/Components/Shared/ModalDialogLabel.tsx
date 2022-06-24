import { FunctionComponent } from 'react'
import { AlertDialogLabel } from '@reach/alert-dialog'

type Props = {
  closeDialog: () => void
  className?: string
}

const ModalDialogLabel: FunctionComponent<Props> = ({ children, closeDialog, className }) => (
  <AlertDialogLabel
    className={`flex-shrink-0 flex justify-between items-center px-4.5 py-3 border-b border-solid border-border bg-contrast text-text ${className}`}
  >
    <div className="w-full flex flex-row justify-between items-center">
      <div className="flex-grow text-text text-base font-medium">{children}</div>
      <div tabIndex={0} className="font-bold text-info cursor-pointer" onClick={closeDialog}>
        Close
      </div>
    </div>
    <hr className="h-1px bg-border no-border m-0" />
  </AlertDialogLabel>
)

export default ModalDialogLabel
