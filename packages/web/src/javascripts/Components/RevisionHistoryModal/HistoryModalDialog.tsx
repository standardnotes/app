import { getPlatformString } from '@/Utils'
import { classNames } from '@standardnotes/utils'
import { Dialog, useDialogStore } from '@ariakit/react'
import { ForwardedRef, forwardRef, ReactNode } from 'react'

type Props = {
  children: ReactNode
  onDismiss: () => void
}

const HistoryModalDialog = forwardRef(({ children, onDismiss }: Props, ref: ForwardedRef<HTMLDivElement>) => {
  const dialog = useDialogStore({
    open: true,
  })

  return (
    <Dialog
      store={dialog}
      aria-label="Note revision history"
      ref={ref}
      className="fixed top-0 left-0 z-modal h-full w-full"
    >
      <div
        className="absolute z-0 h-full w-full bg-passive-5 opacity-0 md:opacity-75"
        role="presentation"
        onClick={onDismiss}
      />
      <div
        className={classNames(
          'absolute z-[1] my-0 flex h-full w-full flex-col rounded-md bg-[color:var(--modal-background-color)]',
          'p-0 pt-safe-top pb-safe-bottom shadow-lg md:max-h-[90%] md:w-[90%] md:max-w-[90%]',
          'md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:transform',
          getPlatformString(),
        )}
      >
        {children}
      </div>
    </Dialog>
  )
})

export default HistoryModalDialog
