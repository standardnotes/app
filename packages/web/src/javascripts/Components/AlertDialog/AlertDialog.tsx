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
    <Dialog store={dialog} role="alertdialog" className="h-full w-full" backdropProps={{ className: '!z-modal' }}>
      <div
        className="absolute z-0 h-full w-full bg-passive-5 opacity-0 md:opacity-75"
        role="presentation"
        onClick={closeDialog}
      />
      <div
        className={classNames(
          'absolute top-1/2 left-1/2 z-[1] max-w-[600px] -translate-x-1/2 -translate-y-1/2 rounded border border-border bg-default px-6 py-5 shadow-xl',
          className,
        )}
      >
        {children}
      </div>
    </Dialog>
  )
}

export default AlertDialog
