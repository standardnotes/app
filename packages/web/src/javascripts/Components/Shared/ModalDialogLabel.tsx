import { FunctionComponent, ReactNode, useEffect } from 'react'
import { AlertDialogLabel } from '@reach/alert-dialog'
import Icon from '@/Components/Icon/Icon'
import { classNames } from '@standardnotes/utils'
import { useAndroidBackHandler } from '@/NativeMobileWeb/useAndroidBackHandler'

type Props = {
  closeDialog: () => void
  className?: string
  headerButtons?: ReactNode
  children?: ReactNode
}

const ModalDialogLabel: FunctionComponent<Props> = ({ children, closeDialog, className, headerButtons }) => {
  const addAndroidBackHandler = useAndroidBackHandler()

  useEffect(() => {
    const removeListener = addAndroidBackHandler(() => {
      closeDialog()
      return true
    })
    return () => {
      if (removeListener) {
        removeListener()
      }
    }
  }, [addAndroidBackHandler, closeDialog])

  return (
    <AlertDialogLabel
      className={classNames(
        'flex flex-shrink-0 items-center justify-between rounded-t border-b border-solid border-border bg-default px-4.5 py-3 text-text',
        className,
      )}
    >
      <div className="flex w-full flex-row items-center justify-between">
        <div className="flex-grow text-lg font-semibold text-text">{children}</div>
        <div className="flex items-center gap-2">
          {headerButtons}
          <button tabIndex={0} className="rounded p-1 font-bold hover:bg-contrast" onClick={closeDialog}>
            <Icon type="close" />
          </button>
        </div>
      </div>
      <hr className="h-1px no-border m-0 bg-border" />
    </AlertDialogLabel>
  )
}

export default ModalDialogLabel
