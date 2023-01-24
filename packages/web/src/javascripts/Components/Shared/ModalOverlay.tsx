import { AlertDialogOverlay } from '@reach/alert-dialog'
import { classNames } from '@standardnotes/snjs'
import { ReactNode, useRef } from 'react'
import { useModalAnimation } from './useModalAnimation'

type Props = {
  isOpen: boolean
  onDismiss?: () => void
  children: ReactNode
  className?: string
}

const ModalOverlay = ({ isOpen, onDismiss, children, className }: Props) => {
  const ldRef = useRef<HTMLButtonElement>(null)

  const [isMounted, setElement] = useModalAnimation(isOpen)

  if (!isMounted) {
    return null
  }

  return (
    <AlertDialogOverlay
      className={classNames('p-0 md:px-0 md:opacity-100', className)}
      leastDestructiveRef={ldRef}
      onDismiss={onDismiss}
      ref={setElement}
    >
      {children}
    </AlertDialogOverlay>
  )
}

export default ModalOverlay
