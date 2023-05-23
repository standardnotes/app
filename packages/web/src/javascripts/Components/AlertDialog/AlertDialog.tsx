import { Dialog, DialogStoreProps, useDialogStore } from '@ariakit/react'
import { classNames } from '@standardnotes/snjs'
import { ReactNode } from 'react'

const AlertDialog = ({
  children,
  closeDialog,
  className,
  ...props
}: { children: ReactNode; closeDialog: () => void; className?: string } & Partial<DialogStoreProps>) => {
  const dialog = useDialogStore({
    open: true,
    ...props,
  })

  return (
    <Dialog
      store={dialog}
      role="alertdialog"
      className="fixed top-0 left-0 z-modal h-full w-full"
      modal={false}
      portal={true}
      preventBodyScroll={true}
    >
      <div
        className="absolute z-0 h-full w-full bg-passive-5 opacity-25 md:opacity-75"
        role="presentation"
        onClick={closeDialog}
      />
      <div
        className={classNames(
          'absolute top-1/2 left-1/2 z-[1] w-[95vw] -translate-x-1/2 -translate-y-1/2 rounded border border-border bg-default px-6 py-5 shadow-xl md:w-auto',
          !className?.includes('max-w-') && 'max-w-[600px]',
          className,
        )}
      >
        {children}
      </div>
    </Dialog>
  )
}

export default AlertDialog
