import { FunctionComponent } from 'react'
import { AlertDialogLabel } from '@reach/alert-dialog'

type Props = {
  closeDialog: () => void
  className?: string
}

const ModalDialogLabel: FunctionComponent<Props> = ({ children, closeDialog, className }) => (
  <AlertDialogLabel className={`sk-panel-header px-4.5 ${className}`}>
    <div className="w-full flex flex-row justify-between items-center">
      <div className="flex-grow color-text text-base font-medium">{children}</div>
      <div tabIndex={0} className="font-bold color-info cursor-pointer" onClick={closeDialog}>
        Close
      </div>
    </div>
    <hr className="h-1px bg-border no-border m-0" />
  </AlertDialogLabel>
)

export default ModalDialogLabel
