import { mergeRefs } from '@/Hooks/mergeRefs'
import { Dialog, useDialogStore } from '@ariakit/react'
import { ForwardedRef, forwardRef, ReactNode } from 'react'
import { useModalAnimation } from '../Modal/useModalAnimation'

type Props = {
  isOpen: boolean
  children: ReactNode
  portal?: boolean
}

const ModalOverlay = forwardRef(
  ({ isOpen, children, portal = true, ...props }: Props, ref: ForwardedRef<HTMLDivElement>) => {
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
        className="h-full w-full"
        backdropProps={{
          className: '!z-modal',
          style: {
            position: !portal ? 'absolute' : 'fixed',
          },
        }}
        ref={mergeRefs([setElement, ref])}
        store={dialog}
        portal={portal}
        {...props}
      >
        {children}
      </Dialog>
    )
  },
)

export default ModalOverlay
