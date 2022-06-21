import { getPlatformString } from '@/Utils'
import { DialogOverlay, DialogContent } from '@reach/dialog'
import { ReactNode } from 'react'

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
        className="rounded shadow-overlay"
        style={{
          width: '90%',
          maxWidth: '90%',
          minHeight: '90%',
          background: 'var(--modal-background-color)',
        }}
      >
        <div className="bg-default flex flex-col h-full overflow-hidden">{children}</div>
      </DialogContent>
    </DialogOverlay>
  )
}

export default HistoryModalDialog
