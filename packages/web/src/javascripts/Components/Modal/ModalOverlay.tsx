import { mergeRefs } from '@/Hooks/mergeRefs'
import { Dialog, useDialogStore } from '@ariakit/react'
import { ForwardedRef, forwardRef, ReactNode } from 'react'
import { useModalAnimation } from '../Modal/useModalAnimation'

type Props = {
  isOpen: boolean
  children: ReactNode
}

const ModalOverlay = forwardRef(({ isOpen, children, ...props }: Props, ref: ForwardedRef<HTMLDivElement>) => {
  const [isMounted, setElement] = useModalAnimation(isOpen)
  const dialog = useDialogStore({
    open: isMounted,
  })

  if (!isMounted) {
    return null
  }

  return (
    <Dialog
      tabIndex={0}
      className="fixed top-0 left-0 z-modal h-full w-full"
      ref={mergeRefs([setElement, ref])}
      store={dialog}
      {...props}
    >
      {children}
    </Dialog>
  )
})

export default ModalOverlay
