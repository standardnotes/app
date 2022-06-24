import { getPlatformString } from '@/Utils'
import { DialogOverlay, DialogContent } from '@reach/dialog'
import { ReactNode } from 'react'
import styled from 'styled-components'

type Props = {
  children: ReactNode
  onDismiss: () => void
}

const StyledDialogContent = styled(DialogContent)`
  width: 90%;
  max-width: 90%;
  min-height: 90%;
  background: var(--modal-background-color);
`

const HistoryModalDialog = ({ children, onDismiss }: Props) => {
  return (
    <DialogOverlay
      className={`sn-component ${getPlatformString()}`}
      onDismiss={onDismiss}
      aria-label="Note revision history"
    >
      <StyledDialogContent aria-label="Note revision history" className="rounded-md shadow-lg">
        <div className="bg-default flex flex-col h-full overflow-hidden">{children}</div>
      </StyledDialogContent>
    </DialogOverlay>
  )
}

export default HistoryModalDialog
