import { FunctionComponent, ReactNode } from 'react'
import { AlertDialogLabel } from '@reach/alert-dialog'

type Props = {
  closeDialog: () => void
  className?: string
  headerButtons?: ReactNode
}

const ModalDialogLabel: FunctionComponent<Props> = ({ children, closeDialog, className, headerButtons }) => (
  <AlertDialogLabel
    className={`flex flex-shrink-0 items-center justify-between border-b border-solid border-border bg-contrast px-4.5 py-3 text-text ${className}`}
  >
    <div className="flex w-full flex-row items-center justify-between">
      <div className="flex-grow text-base font-medium text-text">{children}</div>
      <div className="flex items-center gap-2">
        {headerButtons}
        <div tabIndex={0} className="cursor-pointer font-bold text-info" onClick={closeDialog}>
          Close
        </div>
      </div>
    </div>
    <hr className="h-1px no-border m-0 bg-border" />
  </AlertDialogLabel>
)

export default ModalDialogLabel
