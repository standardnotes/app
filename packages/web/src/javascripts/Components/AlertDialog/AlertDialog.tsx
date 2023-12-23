import { DialogWithClose } from '@/Utils/CloseOpenModalsAndPopovers'
import { Dialog, DialogStoreProps, useDialogStore } from '@ariakit/react'
import { classNames } from '@standardnotes/snjs'
import { ReactNode, useCallback } from 'react'

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

  const addCloseMethod = useCallback(
    (element: HTMLDivElement | null) => {
      if (element) {
        ;(element as DialogWithClose).close = closeDialog
      }
    },
    [closeDialog],
  )

  return (
    <Dialog
      store={dialog}
      role="alertdialog"
      className="pointer-events-auto fixed left-0 top-0 z-modal flex h-full w-full items-center justify-center"
      modal={false}
      portal={true}
      preventBodyScroll={true}
      ref={addCloseMethod}
    >
      <div
        className="absolute z-0 h-full w-full bg-passive-5 opacity-25 md:opacity-75"
        role="presentation"
        onClick={closeDialog}
      />
      <div
        className={classNames(
          'z-[1] w-[95vw] rounded border border-[--popover-border-color] bg-[--popover-background-color] px-6 py-5 shadow-xl [backdrop-filter:var(--popover-backdrop-filter)] md:w-auto',
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
