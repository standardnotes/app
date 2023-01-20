import { FunctionComponent, ReactNode, useEffect } from 'react'
import { AlertDialogLabel } from '@reach/alert-dialog'
import Icon from '@/Components/Icon/Icon'
import { classNames } from '@standardnotes/utils'
import { useAndroidBackHandler } from '@/NativeMobileWeb/useAndroidBackHandler'
import { isIOS } from '@/Utils'
import MobileModalAction from './MobileModalAction'

type Props = {
  closeDialog: () => void
  className?: string
  headerButtons?: ReactNode
  leftMobileButton?: ReactNode
  rightMobileButton?: ReactNode
  children?: ReactNode
}

const ModalDialogLabel: FunctionComponent<Props> = ({
  children,
  closeDialog,
  className,
  headerButtons,
  leftMobileButton,
  rightMobileButton,
}) => {
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
        'flex flex-shrink-0 items-center justify-between rounded-t border-b border-solid border-border bg-default py-2.5 px-1 text-text md:px-4.5 md:py-3',
        isIOS() && 'pt-safe-top',
        className,
      )}
    >
      <div className="grid w-full grid-cols-[0.35fr_1fr_0.35fr] flex-row items-center justify-between gap-2 md:flex md:gap-0">
        {leftMobileButton ? leftMobileButton : <div className="md:hidden" />}
        <div
          className={classNames(
            'overflow-hidden text-ellipsis whitespace-nowrap text-center text-base font-semibold text-text md:flex-grow md:text-left md:text-lg',
          )}
        >
          {children}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          {headerButtons}
          <button tabIndex={0} className="ml-2 rounded p-1 font-bold hover:bg-contrast" onClick={closeDialog}>
            <Icon type="close" />
          </button>
        </div>
        {rightMobileButton ? rightMobileButton : <MobileModalAction children="Done" action={closeDialog} />}
      </div>
      <hr className="h-1px no-border m-0 bg-border" />
    </AlertDialogLabel>
  )
}

export default ModalDialogLabel
