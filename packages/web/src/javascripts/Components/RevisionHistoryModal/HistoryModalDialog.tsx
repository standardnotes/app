import { getPlatformString } from '@/Utils'
import { DialogOverlay, DialogContent } from '@reach/dialog'
import { ReactNode } from 'react'
import Icon from '@/Components/Icon/Icon'

type Props = {
  children: ReactNode
  onDismiss: () => void
}

const HistoryModalDialog = ({ children, onDismiss }: Props) => {
  return (
    <DialogOverlay
      className={`sn-component ${getPlatformString()}`}
      onDismiss={onDismiss}
      aria-label="Note revision history"
    >
      <DialogContent
        aria-label="Note revision history"
        className="my-0 flex h-full w-full flex-col rounded-md bg-[color:var(--modal-background-color)] p-0 shadow-lg md:max-h-[90%] md:w-[90%] md:max-w-[90%]"
      >
        <div className="flex h-full flex-col overflow-hidden bg-default">{children}</div>
      </DialogContent>
    </DialogOverlay>
  )
}

export default HistoryModalDialog
