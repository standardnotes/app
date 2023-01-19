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
        'flex flex-shrink-0 items-center justify-between rounded-t border-b border-solid border-border bg-default py-2.5 px-3 text-text md:px-4.5 md:py-3',
        className,
      )}
    >
      <div className="flex w-full flex-row items-center justify-between">
        <div className="md:hidden" />
        <div className="text-base font-semibold text-text md:flex-grow md:text-lg">{children}</div>
        <div className="hidden items-center gap-2 md:flex">
          {headerButtons}
          <button tabIndex={0} className="rounded p-1 font-bold hover:bg-contrast" onClick={closeDialog}>
            <Icon type="close" />
          </button>
        </div>
        <button className="text-base font-semibold active:shadow-none active:outline-none" onClick={closeDialog}>
          Done
        </button>
      </div>
      <hr className="h-1px no-border m-0 bg-border" />
    </AlertDialogLabel>
  )
}

export default ModalDialogLabel
